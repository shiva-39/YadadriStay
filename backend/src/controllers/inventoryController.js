/**
 * Inventory Controller
 * Handles date-wise room inventory management
 */

const RoomInventory = require('../models/RoomInventory');
const RoomCategory = require('../models/RoomCategory');
const Lodge = require('../models/Lodge');
const Booking = require('../models/Booking');
const OfflineBooking = require('../models/OfflineBooking');
const ActivityLog = require('../models/ActivityLog');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Get inventory for lodge (owner)
 */
const getLodgeInventory = async (req, res) => {
  const { lodgeId } = req.params;
  const { startDate, endDate, categoryId } = req.query;

  // Verify lodge ownership
  const lodge = await Lodge.findOne({ _id: lodgeId, owner: req.user._id });
  if (!lodge) {
    throw new ForbiddenError('You do not own this lodge');
  }

  const query = { lodge: lodgeId };
  if (categoryId) query.roomCategory = categoryId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const inventory = await RoomInventory.find(query)
    .populate('roomCategory', 'name type acType totalRooms')
    .sort({ date: 1, 'roomCategory.name': 1 });

  // Group by date
  const grouped = {};
  inventory.forEach(item => {
    const dateStr = item.date.toISOString().split('T')[0];
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(item);
  });

  // Get categories for reference
  const categories = await RoomCategory.find({ lodge: lodgeId, isActive: true })
    .select('name type acType totalRooms');

  res.json({
    success: true,
    data: {
      lodge: { id: lodge._id, name: lodge.name },
      categories,
      inventory: grouped,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get inventory for room category (owner)
 */
const getCategoryInventory = async (req, res) => {
  const { categoryId } = req.params;
  const { startDate, endDate } = req.query;

  const category = req.roomCategory;

  const query = { roomCategory: categoryId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const inventory = await RoomInventory.find(query).sort({ date: 1 });

  // Calculate stats
  const stats = {
    totalDays: inventory.length,
    fullyAvailable: inventory.filter(i => i.availableRooms === i.totalRooms && !i.isClosed).length,
    partiallyBooked: inventory.filter(i => i.availableRooms > 0 && i.availableRooms < i.totalRooms).length,
    fullyBooked: inventory.filter(i => i.availableRooms === 0 && !i.isClosed).length,
    closed: inventory.filter(i => i.isClosed).length,
    totalReserved: inventory.reduce((sum, i) => sum + i.reservedCount, 0),
  };

  res.json({
    success: true,
    data: {
      category: {
        id: category._id,
        name: category.name,
        totalRooms: category.totalRooms,
        type: category.type,
        acType: category.acType,
      },
      inventory,
      stats,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Bulk update inventory for room category
 */
const bulkUpdateInventory = async (req, res) => {
  const category = req.roomCategory;
  const { updates } = req.body;

  // Validate each update
  for (const update of updates) {
    const date = new Date(update.date);
    if (isNaN(date.getTime())) {
      throw new BadRequestError(`Invalid date: ${update.date}`);
    }
    if (update.availableRooms !== undefined && update.availableRooms < 0) {
      throw new BadRequestError('Available rooms cannot be negative');
    }
    if (update.blockedRooms !== undefined && update.blockedRooms < 0) {
      throw new BadRequestError('Blocked rooms cannot be negative');
    }
  }

  const result = await RoomInventory.bulkUpdateAvailability(updates, req.user._id);

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'bulk_update_inventory',
    actionCategory: 'inventory',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Bulk updated inventory for ${updates.length} dates`,
    metadata: { updatesCount: updates.length, modifiedCount: result.modifiedCount },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Inventory updated successfully',
    data: { modifiedCount: result.modifiedCount },
  });
};

/**
 * Extend inventory for future dates
 */
const extendInventory = async (req, res) => {
  const category = req.roomCategory;
  const { days = 90 } = req.body;

  if (days < 1 || days > 365) {
    throw new BadRequestError('Days must be between 1 and 365');
  }

  // Find the latest inventory date
  const latestInventory = await RoomInventory.findOne({ roomCategory: category._id })
    .sort({ date: -1 });

  const startDate = latestInventory
    ? new Date(latestInventory.date.getTime() + 24 * 60 * 60 * 1000)
    : new Date();

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);

  // Get price snapshot from category
  const priceSnapshot = {
    basePrice: category.pricing.basePrice,
    weekendPrice: category.pricing.weekendPrice,
    holidayPrice: category.pricing.holidayPrice,
    currency: 'INR',
  };

  await RoomInventory.ensureInventoryForRange(
    category.lodge,
    category._id,
    startDate,
    endDate,
    category.totalRooms,
    priceSnapshot
  );

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'extend_inventory',
    actionCategory: 'inventory',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Extended inventory for ${days} days (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Inventory extended for ${days} days`,
    data: { startDate, endDate },
  });
};

/**
 * Check availability for booking
 */
const checkAvailability = async (req, res) => {
  const { lodgeId, roomCategoryId, checkInDate, checkOutDate, rooms = 1 } = req.query;

  if (!lodgeId || !roomCategoryId || !checkInDate || !checkOutDate) {
    throw new BadRequestError('lodgeId, roomCategoryId, checkInDate, and checkOutDate are required');
  }

  const category = await RoomCategory.findById(roomCategoryId);
  if (!category) {
    throw new NotFoundError('Room category not found');
  }

  if (category.lodge.toString() !== lodgeId) {
    throw new BadRequestError('Room category does not belong to this lodge');
  }

  const availability = await RoomInventory.getAvailabilityForRange(
    lodgeId,
    roomCategoryId,
    checkInDate,
    checkOutDate
  );

  const minAvailable = Math.min(...availability.map(a => a.availableRooms));
  const canBook = minAvailable >= parseInt(rooms);
  const priceInfo = category.calculatePrice(checkInDate, checkOutDate);

  res.json({
    success: true,
    data: {
      category: {
        id: category._id,
        name: category.name,
        totalRooms: category.totalRooms,
      },
      availability,
      minAvailable,
      canBook,
      priceInfo,
      requestedRooms: parseInt(rooms),
    },
  });
};

module.exports = {
  getLodgeInventory,
  getCategoryInventory,
  bulkUpdateInventory,
  extendInventory,
  checkAvailability,
};