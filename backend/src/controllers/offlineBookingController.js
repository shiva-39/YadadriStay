/**
 * Offline Booking Controller
 * Handles walk-in/direct booking management for lodge owners
 */

const OfflineBooking = require('../models/OfflineBooking');
const RoomCategory = require('../models/RoomCategory');
const RoomInventory = require('../models/RoomInventory');
const Lodge = require('../models/Lodge');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Create offline booking
 */
const createOfflineBooking = async (req, res) => {
  const owner = req.user;
  const {
    lodgeId,
    roomCategoryId,
    customerName,
    customerPhone,
    customerEmail,
    customerIdProof,
    guests,
    rooms,
    checkInDate,
    checkOutDate,
    pricing,
    payment,
    source,
    notes,
  } = req.body;

  // Verify lodge ownership
  const lodge = await Lodge.findOne({ _id: lodgeId, owner: owner._id });
  if (!lodge) {
    throw new ForbiddenError('You do not own this lodge');
  }

  // Verify room category
  const roomCategory = await RoomCategory.findOne({ _id: roomCategoryId, lodge: lodgeId, isActive: true });
  if (!roomCategory) {
    throw new NotFoundError('Room category not found');
  }

  // Validate capacity
  const totalGuests = guests.adults + (guests.children || 0);
  if (totalGuests > roomCategory.capacity.maxOccupancy * rooms) {
    throw new BadRequestError(`Maximum occupancy for ${rooms} room(s) is ${roomCategory.capacity.maxOccupancy * rooms} guests`);
  }

  // Check availability
  const availability = await RoomInventory.getAvailabilityForRange(lodgeId, roomCategoryId, checkInDate, checkOutDate);
  const minAvailable = Math.min(...availability.map(a => a.availableRooms));

  if (minAvailable < rooms) {
    throw new ConflictError('Not enough rooms available for the selected dates');
  }

  // Create offline booking
  const offlineBooking = new OfflineBooking({
    lodge: lodgeId,
    roomCategory: roomCategoryId,
    recordedBy: owner._id,
    customerName,
    customerPhone,
    customerEmail,
    customerIdProof,
    guests: {
      adults: guests.adults,
      children: guests.children || 0,
    },
    rooms,
    checkInDate: new Date(checkInDate),
    checkOutDate: new Date(checkOutDate),
    pricing,
    payment: payment || { method: 'cash', status: 'pending' },
    source: source || 'walk_in',
    notes,
  });

  // Calculate pricing if not provided
  if (!pricing || !pricing.totalAmount) {
    offlineBooking.calculatePricing(roomCategory);
  }

  await offlineBooking.save();

  // Update inventory
  await RoomInventory.updateMany(
    {
      lodge: lodgeId,
      roomCategory: roomCategoryId,
      date: { $gte: new Date(checkInDate), $lt: new Date(checkOutDate) },
    },
    {
      $inc: { availableRooms: -rooms },
      $push: {
        offlineBookedRooms: {
          offlineBookingId: offlineBooking._id,
          quantity: rooms,
        },
      },
    }
  );

  // Notify customer if phone provided (would integrate with SMS/WhatsApp in production)
  // For now, just log

  // Log activity
  await ActivityLog.log({
    user: owner._id,
    userRole: owner.role,
    userName: owner.fullName,
    action: 'create_offline_booking',
    actionCategory: 'booking',
    entityType: 'offline_booking',
    entityId: offlineBooking._id,
    entityName: offlineBooking.bookingId,
    description: `Created offline booking ${offlineBooking.bookingId} for ${customerName}`,
    metadata: { customerName, customerPhone, rooms, checkInDate, checkOutDate },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Offline booking created successfully',
    data: { booking: offlineBooking },
  });
};

/**
 * Get offline bookings for owner's lodges
 */
const getOfflineBookings = async (req, res) => {
  const { status, lodgeId, page = 1, limit = 20 } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (status) query.status = status;
  if (lodgeId) query.lodge = lodgeId;

  const bookings = await OfflineBooking.find(query)
    .populate('lodge', 'name')
    .populate('roomCategory', 'name type')
    .populate('recordedBy', 'fullName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await OfflineBooking.countDocuments(query);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * Get offline booking by ID
 */
const getOfflineBookingById = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await OfflineBooking.findOne({ _id: id, lodge: { $in: lodges } })
    .populate('lodge', 'name address contact policies')
    .populate('roomCategory', 'name type acType capacity amenities')
    .populate('recordedBy', 'fullName');

  if (!booking) {
    throw new NotFoundError('Offline booking not found');
  }

  res.json({
    success: true,
    data: { booking },
  });
};

/**
 * Update offline booking
 */
const updateOfflineBooking = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await OfflineBooking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Offline booking not found');
  }

  // Only allow updates if booking is confirmed (not checked in/out)
  if (!['confirmed'].includes(booking.status)) {
    throw new BadRequestError('Cannot update booking in current status');
  }

  const allowedUpdates = ['customerName', 'customerPhone', 'customerEmail', 'guests', 'rooms', 'checkInDate', 'checkOutDate', 'pricing', 'notes', 'source'];
  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) booking[key] = req.body[key];
  });

  // If dates or rooms changed, need to update inventory
  if (req.body.checkInDate || req.body.checkOutDate || req.body.rooms) {
    // This would require complex inventory reconciliation
    // For simplicity, we'll prevent date/room changes after creation
    throw new BadRequestError('Cannot change dates or room count after creation');
  }

  await booking.save();

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'update_offline_booking',
    actionCategory: 'booking',
    entityType: 'offline_booking',
    entityId: booking._id,
    entityName: booking.bookingId,
    description: `Updated offline booking ${booking.bookingId}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Offline booking updated successfully',
    data: { booking },
  });
};

/**
 * Cancel offline booking
 */
const cancelOfflineBooking = async (req, res) => {
  const { id } = req.params;
  const { reason, refundAmount = 0 } = req.body;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await OfflineBooking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Offline booking not found');
  }

  if (!['confirmed'].includes(booking.status)) {
    throw new BadRequestError('Cannot cancel booking in current status');
  }

  await booking.cancel(req.user._id, reason || 'Cancelled by owner', refundAmount);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'cancel_offline_booking',
    actionCategory: 'booking',
    entityType: 'offline_booking',
    entityId: booking._id,
    entityName: booking.bookingId,
    description: `Cancelled offline booking ${booking.bookingId}. Reason: ${reason}`,
    metadata: { refundAmount },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Offline booking cancelled successfully',
    data: { booking, refundAmount },
  });
};

/**
 * Check-in guest
 */
const checkIn = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await OfflineBooking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Offline booking not found');
  }

  if (booking.status !== 'confirmed') {
    throw new BadRequestError('Only confirmed bookings can be checked in');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(booking.checkInDate);
  checkInDate.setHours(0, 0, 0, 0);

  if (checkInDate > today) {
    throw new BadRequestError('Cannot check in before check-in date');
  }

  await booking.checkInGuest(req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'offline_checkin',
    actionCategory: 'booking',
    entityType: 'offline_booking',
    entityId: booking._id,
    entityName: booking.bookingId,
    description: `Checked in guest for offline booking ${booking.bookingId}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Guest checked in successfully',
    data: { booking },
  });
};

/**
 * Check-out guest
 */
const checkOut = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await OfflineBooking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Offline booking not found');
  }

  if (booking.status !== 'checked_in') {
    throw new BadRequestError('Only checked-in guests can be checked out');
  }

  await booking.checkOutGuest(req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'offline_checkout',
    actionCategory: 'booking',
    entityType: 'offline_booking',
    entityId: booking._id,
    entityName: booking.bookingId,
    description: `Checked out guest for offline booking ${booking.bookingId}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Guest checked out successfully',
    data: { booking },
  });
};

/**
 * Record payment for offline booking
 */
const recordPayment = async (req, res) => {
  const { id } = req.params;
  const { amount, method, transactionRef } = req.body;

  if (!amount || amount <= 0) {
    throw new BadRequestError('Valid payment amount is required');
  }

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await OfflineBooking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Offline booking not found');
  }

  await booking.recordPayment(amount, method || 'cash', transactionRef, req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'record_offline_payment',
    actionCategory: 'payment',
    entityType: 'offline_booking',
    entityId: booking._id,
    entityName: booking.bookingId,
    description: `Recorded payment of ₹${amount} for offline booking ${booking.bookingId}`,
    metadata: { amount, method, transactionRef },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Payment recorded successfully',
    data: { booking },
  });
};

module.exports = {
  createOfflineBooking,
  getOfflineBookings,
  getOfflineBookingById,
  updateOfflineBooking,
  cancelOfflineBooking,
  checkIn,
  checkOut,
  recordPayment,
};