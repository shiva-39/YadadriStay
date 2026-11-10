/**
 * Booking Controller
 * Handles online booking creation, management, and workflow
 */

const Booking = require('../models/Booking');
const RoomCategory = require('../models/RoomCategory');
const RoomInventory = require('../models/RoomInventory');
const Lodge = require('../models/Lodge');
const Payment = require('../models/Payment');
const AdminSettings = require('../models/AdminSettings');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Create new booking
 */
const createBooking = async (req, res) => {
  const customer = req.user;
  const { lodgeId, roomCategoryId, checkInDate, checkOutDate, guests, rooms, specialRequests } = req.body;

  // Verify lodge and room category
  const lodge = await Lodge.findOne({ _id: lodgeId, status: 'approved' });
  if (!lodge) {
    throw new NotFoundError('Lodge not found or not approved');
  }

  const roomCategory = await RoomCategory.findOne({ _id: roomCategoryId, lodge: lodgeId, isActive: true });
  if (!roomCategory) {
    throw new NotFoundError('Room category not found');
  }

  // Validate capacity
  const totalGuests = guests.adults + (guests.children || 0);
  if (totalGuests > roomCategory.capacity.maxOccupancy * rooms) {
    throw new BadRequestError(`Maximum occupancy for ${rooms} room(s) is ${roomCategory.capacity.maxOccupancy * rooms} guests`);
  }

  // Check availability using atomic inventory
  const availability = await RoomInventory.getAvailabilityForRange(lodgeId, roomCategoryId, checkInDate, checkOutDate);
  const minAvailable = Math.min(...availability.map(a => a.availableRooms));

  if (minAvailable < rooms) {
    throw new ConflictError('Not enough rooms available for the selected dates');
  }

  // Get advance percentage from settings or lodge
  const settings = await AdminSettings.getSettings();
  const advancePercentage = lodge.policies.advancePaymentPercentage || settings.payments.defaultAdvancePercentage;

  // Create booking
  const booking = new Booking({
    customer: customer._id,
    lodge: lodgeId,
    roomCategory: roomCategoryId,
    guests: {
      adults: guests.adults,
      children: guests.children || 0,
    },
    rooms,
    checkInDate: new Date(checkInDate),
    checkOutDate: new Date(checkOutDate),
    specialRequests,
    contactPhone: customer.phone,
    contactEmail: customer.email,
    source: 'android_app',
  });

  // Calculate pricing
  booking.calculatePricing(roomCategory, advancePercentage);
  booking.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await booking.save();

  // Reserve inventory atomically (with fallback for standalone MongoDB)
  try {
    await RoomInventory.reserveRoomsUnified(
      lodgeId,
      roomCategoryId,
      checkInDate,
      checkOutDate,
      rooms,
      booking._id,
      10 // 10 minutes
    );
  } catch (error) {
    // If reservation fails, delete booking
    await booking.deleteOne();
    throw error;
  }

  // Get UPI QR code for payment
  const upiSettings = await AdminSettings.getSection('upi');
  const upiQR = upiSettings.qrCodeUrl;

  // Create payment record
  const payment = await Payment.create({
    booking: booking._id,
    customer: customer._id,
    lodge: lodgeId,
    amount: booking.pricing.advanceAmount,
    upi: {
      vpa: upiSettings.vpa,
    },
    status: 'awaiting_payment',
  });

  // Link payment to booking
  booking.payment = payment._id;
  await booking.save();

  // Send notifications
  await Notification.createNotification({
    user: customer._id,
    type: 'booking_reminder',
    title: 'Booking Created - Payment Required',
    message: `Your booking ${booking.bookingId} has been created. Please complete payment within 10 minutes to confirm.`,
    relatedEntity: { entityType: 'booking', entityId: booking._id },
    actionUrl: `/bookings/${booking._id}/payment`,
    actionText: 'Pay Now',
    priority: 'high',
  });

  // Notify lodge owner
  await Notification.createNotification({
    user: lodge.owner,
    type: 'booking_confirmed',
    title: 'New Booking Received',
    message: `New booking ${booking.bookingId} received for ${roomCategory.name}. Payment pending verification.`,
    relatedEntity: { entityType: 'booking', entityId: booking._id },
    priority: 'normal',
  });

  // Log activity
  await ActivityLog.logBooking(customer, booking, 'create', { ip: req.ip });

  res.status(201).json({
    success: true,
    message: 'Booking created. Please complete payment within 10 minutes.',
    data: {
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        pricing: booking.pricing,
        expiresAt: booking.expiresAt,
      },
      payment: {
        id: payment._id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        upi: {
          vpa: payment.upi.vpa,
          qrCodeUrl: upiQR,
        },
      },
    },
  });
};

/**
 * Get user's bookings
 */
const getMyBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { customer: req.user._id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('lodge', 'name address contact phone images')
    .populate('roomCategory', 'name type acType capacity images')
    .populate('payment', 'paymentId status amount upi screenshot verification')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Booking.countDocuments(query);

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
 * Get booking by ID
 */
const getBookingById = async (req, res) => {
  const booking = req.booking;

  // Populate additional data based on user role
  let populateOptions = [
    { path: 'lodge', select: 'name address contact phone images policies' },
    { path: 'roomCategory', select: 'name type acType capacity amenities images' },
    { path: 'payment', select: 'paymentId status amount upi screenshot verification' },
  ];

  if (req.user.role === 'super_admin' || req.user.role === 'lodge_owner') {
    populateOptions.push({ path: 'customer', select: 'fullName phone email' });
  }

  await booking.populate(populateOptions);

  res.json({
    success: true,
    data: { booking },
  });
};

/**
 * Cancel booking
 */
const cancelBooking = async (req, res) => {
  const booking = req.booking;
  const { reason } = req.body;

  if (!booking.canCancel) {
    throw new BadRequestError('Booking cannot be cancelled at this stage');
  }

  // Determine refund amount based on policy
  let refundAmount = 0;
  if (req.user.role === 'super_admin') {
    // Admin can do full refund
    refundAmount = booking.pricing.advanceAmount;
  } else if (booking.status === 'pending_payment' || booking.status === 'pending_verification') {
    // No payment made or payment not verified - full refund of advance
    refundAmount = booking.pricing.advanceAmount;
  } else {
    // Standard cancellation - no refund for advance (as per policy)
    refundAmount = 0;
  }

  await booking.cancel(req.user._id, reason || 'Cancelled by user', refundAmount);

  // If payment was made and verified, initiate refund
  if (booking.payment && refundAmount > 0) {
    const Payment = require('../models/Payment');
    const payment = await Payment.findById(booking.payment);
    if (payment && payment.status === 'verified') {
      payment.status = 'refund_pending';
      payment.refund = {
        requestedAt: new Date(),
        requestedBy: req.user._id,
        reason: reason || 'Booking cancelled',
        amount: refundAmount,
        status: 'pending',
      };
      await payment.save();
    }
  }

  // Notify lodge owner
  await Notification.createNotification({
    user: booking.lodge.owner,
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `Booking ${booking.bookingId} has been cancelled. Reason: ${reason || 'Not specified'}`,
    relatedEntity: { entityType: 'booking', entityId: booking._id },
    priority: 'normal',
  });

  // Log activity
  await ActivityLog.logBooking(req.user, booking, 'cancel', { reason, refundAmount, ip: req.ip });

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: { booking, refundAmount },
  });
};

/**
 * Check-in guest
 */
const checkIn = async (req, res) => {
  const booking = req.booking;

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

  // Log activity
  await ActivityLog.logBooking(req.user, booking, 'checkin', { ip: req.ip });

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
  const booking = req.booking;

  if (booking.status !== 'checked_in') {
    throw new BadRequestError('Only checked-in guests can be checked out');
  }

  await booking.checkOutGuest(req.user._id);

  // Log activity
  await ActivityLog.logBooking(req.user, booking, 'checkout', { ip: req.ip });

  res.json({
    success: true,
    message: 'Guest checked out successfully',
    data: { booking },
  });
};

/**
 * Download booking receipt
 */
const downloadReceipt = async (req, res) => {
  const booking = req.booking;

  // Generate PDF receipt
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${booking.bookingId}.pdf"`);

  doc.pipe(res);

  // Receipt content
  doc.fontSize(24).text('Yadadri Stay', { align: 'center' });
  doc.fontSize(14).text('Booking Receipt', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Booking ID: ${booking.bookingId}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  doc.text(`Lodge: ${booking.lodge.name}`);
  doc.text(`Address: ${booking.lodge.address.street}, ${booking.lodge.address.city} - ${booking.lodge.address.pincode}`);
  doc.text(`Phone: ${booking.lodge.contact.phone}`);
  doc.moveDown();

  doc.text(`Room: ${booking.roomCategory.name} (${booking.roomCategory.type})`);
  doc.text(`Check-in: ${booking.checkInDate.toLocaleDateString()} at ${booking.lodge.policies.checkInTime}`);
  doc.text(`Check-out: ${booking.checkOutDate.toLocaleDateString()} at ${booking.lodge.policies.checkOutTime}`);
  doc.text(`Nights: ${booking.nights}`);
  doc.text(`Rooms: ${booking.rooms}`);
  doc.text(`Guests: ${booking.guests.adults} Adults, ${booking.guests.children} Children`);
  doc.moveDown();

  doc.text(`Total Amount: ₹${booking.pricing.totalAmount.toLocaleString()}`);
  doc.text(`Advance Paid: ₹${booking.pricing.advanceAmount.toLocaleString()}`);
  doc.text(`Remaining: ₹${booking.pricing.remainingAmount.toLocaleString()}`);
  doc.moveDown();

  if (booking.payment) {
    const Payment = require('../models/Payment');
    const payment = await Payment.findById(booking.payment);
    if (payment) {
      doc.text(`Payment ID: ${payment.paymentId}`);
      doc.text(`Transaction Ref: ${payment.upi.transactionRef}`);
      doc.text(`Payment Status: ${payment.status}`);
    }
  }

  doc.moveDown();
  doc.fontSize(10).text('Thank you for choosing Yadadri Stay!', { align: 'center' });
  doc.text('For support, contact us at support@yadadristay.com', { align: 'center' });

  doc.end();
};

/**
 * Get owner's bookings
 */
const getOwnerBookings = async (req, res) => {
  const { status, lodgeId, page = 1, limit = 20 } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (status) query.status = status;
  if (lodgeId) query.lodge = lodgeId;

  const bookings = await Booking.find(query)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('roomCategory', 'name')
    .populate('payment', 'paymentId status amount')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Booking.countDocuments(query);

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
 * Get owner's booking by ID
 */
const getOwnerBookingById = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await Booking.findOne({ _id: id, lodge: { $in: lodges } })
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name address contact policies')
    .populate('roomCategory', 'name type acType capacity amenities')
    .populate('payment', 'paymentId status amount upi screenshot verification');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  res.json({
    success: true,
    data: { booking },
  });
};

/**
 * Owner check-in
 */
const ownerCheckIn = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await Booking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status !== 'confirmed') {
    throw new BadRequestError('Only confirmed bookings can be checked in');
  }

  await booking.checkInGuest(req.user._id);

  await ActivityLog.logBooking(req.user, booking, 'owner_checkin', { ip: req.ip });

  res.json({
    success: true,
    message: 'Guest checked in successfully',
    data: { booking },
  });
};

/**
 * Owner check-out
 */
const ownerCheckOut = async (req, res) => {
  const { id } = req.params;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const booking = await Booking.findOne({ _id: id, lodge: { $in: lodges } });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status !== 'checked_in') {
    throw new BadRequestError('Only checked-in guests can be checked out');
  }

  await booking.checkOutGuest(req.user._id);

  await ActivityLog.logBooking(req.user, booking, 'owner_checkout', { ip: req.ip });

  res.json({
    success: true,
    message: 'Guest checked out successfully',
    data: { booking },
  });
};

/**
 * Get all bookings (admin)
 */
const getAllBookings = async (req, res) => {
  const { status, lodgeId, customerId, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (lodgeId) query.lodge = lodgeId;
  if (customerId) query.customer = customerId;

  const bookings = await Booking.find(query)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('roomCategory', 'name')
    .populate('payment', 'paymentId status amount')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Booking.countDocuments(query);

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
 * Get booking by ID (admin)
 */
const getBookingByIdAdmin = async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findById(id)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name address contact policies')
    .populate('roomCategory', 'name type acType capacity amenities')
    .populate('payment', 'paymentId status amount upi screenshot verification');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  res.json({
    success: true,
    data: { booking },
  });
};

/**
 * Update booking status (admin)
 */
const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['confirmed', 'cancelled', 'refunded', 'no_show'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status');
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  const oldStatus = booking.status;
  booking.status = status;

  if (status === 'cancelled' || status === 'refunded') {
    await booking.cancel(req.user._id, 'Cancelled by admin', status === 'refunded' ? booking.pricing.advanceAmount : 0);
  }

  await booking.save();

  await ActivityLog.logBooking(req.user, booking, 'admin_status_change', {
    oldStatus,
    newStatus: status,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Booking status updated',
    data: { booking },
  });
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  checkIn,
  checkOut,
  downloadReceipt,
  getOwnerBookings,
  getOwnerBookingById,
  ownerCheckIn,
  ownerCheckOut,
  getAllBookings,
  getBookingByIdAdmin,
  updateBookingStatus,
};