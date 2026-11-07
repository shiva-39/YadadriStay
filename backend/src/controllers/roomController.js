/**
 * Room Category Controller
 * Handles room category CRUD, availability, and pricing
 */

const RoomCategory = require('../models/RoomCategory');
const RoomInventory = require('../models/RoomInventory');
const Lodge = require('../models/Lodge');
const Booking = require('../models/Booking');
const ActivityLog = require('../models/ActivityLog');
const { uploadRoomImage, deleteFile } = require('../utils/cloudinary');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Get room categories for a lodge (public)
 */
const getRoomCategoriesForLodge = async (req, res) => {
  const { lodgeId } = req.params;
  const { checkInDate, checkOutDate, adults = 1, children = 0 } = req.query;

  const lodge = await Lodge.findOne({ _id: lodgeId, status: 'approved' });
  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  const categories = await RoomCategory.find({ lodge: lodgeId, isActive: true })
    .sort({ displayOrder: 1, 'pricing.basePrice': 1 });

  let categoriesWithAvailability = categories;

  if (checkInDate && checkOutDate) {
    categoriesWithAvailability = await Promise.all(
      categories.map(async (cat) => {
        const availability = await cat.getAvailabilityForRange(checkInDate, checkOutDate);
        const minAvailable = Math.min(...availability.map((a) => a.available));
        const priceInfo = cat.calculatePrice(checkInDate, checkOutDate, { adults, children });

        return {
          ...cat.toObject(),
          availability,
          minAvailable,
          priceInfo,
          canBook: minAvailable > 0,
        };
      })
    );

    categoriesWithAvailability = categoriesWithAvailability.filter(c => c.canBook);
  }

  res.json({
    success: true,
    data: {
      lodge: {
        id: lodge._id,
        name: lodge.name,
        checkInTime: lodge.policies.checkInTime,
        checkOutTime: lodge.policies.checkOutTime,
      },
      categories: categoriesWithAvailability,
    },
  });
};

/**
 * Get room category by ID (public)
 */
const getRoomCategoryById = async (req, res) => {
  const { id } = req.params;

  const category = await RoomCategory.findOne({ _id: id, isActive: true })
    .populate('lodge', 'name address contact policies');

  if (!category) {
    throw new NotFoundError('Room category not found');
  }

  if (category.lodge.status !== 'approved') {
    throw new NotFoundError('Room category not found');
  }

  res.json({
    success: true,
    data: { category },
  });
};

/**
 * Check room category availability for dates
 */
const checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  if (!checkInDate || !checkOutDate) {
    throw new BadRequestError('Check-in and check-out dates are required');
  }

  const category = await RoomCategory.findOne({ _id: id, isActive: true })
    .populate('lodge', 'name policies');

  if (!category) {
    throw new NotFoundError('Room category not found');
  }

  const availability = await category.getAvailabilityForRange(checkInDate, checkOutDate);
  const priceInfo = category.calculatePrice(checkInDate, checkOutDate);

  res.json({
    success: true,
    data: {
      category: {
        id: category._id,
        name: category.name,
        totalRooms: category.totalRooms,
        capacity: category.capacity,
      },
      lodge: {
        id: category.lodge._id,
        name: category.lodge.name,
        checkInTime: category.lodge.policies.checkInTime,
        checkOutTime: category.lodge.policies.checkOutTime,
      },
      availability,
      priceInfo,
      checkInDate,
      checkOutDate,
    },
  });
};

/**
 * Create room category (owner)
 */
const createRoomCategory = async (req, res) => {
  const { lodgeId } = req.body;

  // Verify lodge ownership
  const lodge = await Lodge.findOne({ _id: lodgeId, owner: req.user._id });
  if (!lodge) {
    throw new ForbiddenError('You do not own this lodge');
  }

  // Check if lodge is in a state that allows adding rooms
  if (!['draft', 'pending_approval', 'approved'].includes(lodge.status)) {
    throw new BadRequestError('Cannot add rooms to this lodge in its current state');
  }

  // Process uploaded images
  const images = [];
  if (req.files && req.files.images) {
    for (let i = 0; i < req.files.images.length; i++) {
      const file = req.files.images[i];
      const result = await uploadRoomImage(file.buffer, lodgeId, 'new');
      images.push({
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: i === 0,
        order: i,
      });
    }
  }

  // Process uploaded videos
  const videos = [];
  if (req.files && req.files.videos) {
    for (let i = 0; i < req.files.videos.length; i++) {
      const file = req.files.videos[i];
      const result = await require('../utils/cloudinary').uploadFile(file.path, {
        folder: `yadadri-stay/lodges/${lodgeId}/rooms`,
        resource_type: 'video',
      });
      videos.push({
        url: result.secure_url,
        publicId: result.public_id,
        order: i,
      });
    }
  }

  const roomData = {
    ...req.body,
    lodge: lodgeId,
    images,
    videos,
  };

  const category = await RoomCategory.create(roomData);

  // Create inventory records for the next 90 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  await RoomInventory.ensureInventoryForRange(
    lodgeId,
    category._id,
    startDate,
    endDate,
    category.totalRooms,
    {
      basePrice: category.pricing.basePrice,
      weekendPrice: category.pricing.weekendPrice,
      holidayPrice: category.pricing.holidayPrice,
      currency: 'INR',
    }
  );

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'create_room_category',
    actionCategory: 'room',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Created room category "${category.name}" for lodge "${lodge.name}"`,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Room category created successfully',
    data: { category },
  });
};

/**
 * Get owner's room categories
 */
const getOwnerRoomCategories = async (req, res) => {
  const { lodgeId } = req.query;

  const query = { isActive: true };
  if (lodgeId) {
    // Verify ownership
    const lodge = await Lodge.findOne({ _id: lodgeId, owner: req.user._id });
    if (!lodge) {
      throw new ForbiddenError('You do not own this lodge');
    }
    query.lodge = lodgeId;
  } else {
    // Get all lodges owned by user
    const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
    query.lodge = { $in: lodges };
  }

  const categories = await RoomCategory.find(query)
    .populate('lodge', 'name status')
    .sort({ 'lodge.name': 1, displayOrder: 1 });

  res.json({
    success: true,
    data: { categories },
  });
};

/**
 * Get owner's room category by ID
 */
const getOwnerRoomCategoryById = async (req, res) => {
  const category = req.roomCategory;

  // Get inventory stats for next 30 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const inventory = await RoomInventory.getAvailabilityForRange(
    category.lodge,
    category._id,
    startDate,
    endDate
  );

  const stats = {
    totalDays: inventory.length,
    fullyBookedDays: inventory.filter(i => i.availableRooms === 0 && !i.isClosed).length,
    partiallyBookedDays: inventory.filter(i => i.availableRooms > 0 && i.availableRooms < i.totalRooms).length,
    availableDays: inventory.filter(i => i.availableRooms === i.totalRooms).length,
    closedDays: inventory.filter(i => i.isClosed).length,
  };

  res.json({
    success: true,
    data: {
      category: {
        ...category.toObject(),
        inventory,
        stats,
      },
    },
  });
};

/**
 * Update room category
 */
const updateRoomCategory = async (req, res) => {
  const category = req.roomCategory;

  // If category has active bookings, prevent certain changes
  const activeBookings = await Booking.countDocuments({
    roomCategory: category._id,
    status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] },
    checkOutDate: { $gte: new Date() },
  });

  const allowedUpdates = [
    'name', 'description', 'pricing', 'amenities', 'isActive',
    'displayOrder', 'pricingRules', 'images', 'videos',
  ];

  // If there are active bookings, don't allow capacity/type changes
  if (activeBookings > 0) {
    const restrictedFields = ['capacity', 'type', 'acType', 'totalRooms'];
    restrictedFields.forEach(field => delete req.body[field]);
  }

  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) category[key] = req.body[key];
  });

  // Process new images
  if (req.files && req.files.images) {
    const existingCount = category.images.length;
    for (let i = 0; i < req.files.images.length; i++) {
      const file = req.files.images[i];
      const result = await uploadRoomImage(file.buffer, category.lodge.toString(), category._id.toString());
      category.images.push({
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: existingCount === 0 && i === 0,
        order: existingCount + i,
      });
    }
  }

  // Process new videos
  if (req.files && req.files.videos) {
    const existingCount = category.videos.length;
    for (let i = 0; i < req.files.videos.length; i++) {
      const file = req.files.videos[i];
      const result = await require('../utils/cloudinary').uploadFile(file.path, {
        folder: `yadadri-stay/lodges/${category.lodge}/rooms/${category._id}`,
        resource_type: 'video',
      });
      category.videos.push({
        url: result.secure_url,
        publicId: result.public_id,
        order: existingCount + i,
      });
    }
  }

  await category.save();

  // If pricing changed, update future inventory price snapshots
  if (req.body.pricing) {
    await RoomInventory.updateMany(
      {
        roomCategory: category._id,
        date: { $gte: new Date() },
      },
      {
        $set: {
          'priceSnapshot.basePrice': category.pricing.basePrice,
          'priceSnapshot.weekendPrice': category.pricing.weekendPrice,
          'priceSnapshot.holidayPrice': category.pricing.holidayPrice,
        },
      }
    );
  }

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'update_room_category',
    actionCategory: 'room',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Updated room category "${category.name}"`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Room category updated successfully',
    data: { category },
  });
};

/**
 * Delete room category
 */
const deleteRoomCategory = async (req, res) => {
  const category = req.roomCategory;

  // Check for active bookings
  const activeBookings = await Booking.countDocuments({
    roomCategory: category._id,
    status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] },
    checkOutDate: { $gte: new Date() },
  });

  if (activeBookings > 0) {
    throw new ConflictError('Cannot delete room category with active bookings');
  }

  // Soft delete
  category.isActive = false;
  await category.save();

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'delete_room_category',
    actionCategory: 'room',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Deleted room category "${category.name}"`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Room category deactivated successfully',
  });
};

/**
 * Bulk update room availability
 */
const updateAvailability = async (req, res) => {
  const category = req.roomCategory;
  const { updates } = req.body;

  // Validate updates
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new BadRequestError('Updates array is required');
  }

  // Verify all dates are valid and belong to this category
  for (const update of updates) {
    if (!update.date || !update.availableRooms !== undefined) {
      throw new BadRequestError('Each update must have date and availableRooms');
    }
  }

  const result = await RoomInventory.bulkUpdateAvailability(updates, req.user._id);

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'bulk_update_availability',
    actionCategory: 'inventory',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Bulk updated availability for ${updates.length} dates`,
    metadata: { updatesCount: updates.length, modifiedCount: result.modifiedCount },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Availability updated successfully',
    data: { modifiedCount: result.modifiedCount },
  });
};

/**
 * Update room pricing
 */
const updatePricing = async (req, res) => {
  const category = req.roomCategory;
  const { basePrice, weekendPrice, holidayPrice, advancePercentage } = req.body;

  if (basePrice !== undefined) category.pricing.basePrice = basePrice;
  if (weekendPrice !== undefined) category.pricing.weekendPrice = weekendPrice;
  if (holidayPrice !== undefined) category.pricing.holidayPrice = holidayPrice;
  if (advancePercentage !== undefined) category.pricingRules.advancePercentage = advancePercentage;

  await category.save();

  // Update future inventory price snapshots
  await RoomInventory.updateMany(
    {
      roomCategory: category._id,
      date: { $gte: new Date() },
    },
    {
      $set: {
        'priceSnapshot.basePrice': category.pricing.basePrice,
        'priceSnapshot.weekendPrice': category.pricing.weekendPrice,
        'priceSnapshot.holidayPrice': category.pricing.holidayPrice,
      },
    }
  );

  // Log activity
  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'update_pricing',
    actionCategory: 'room',
    entityType: 'room_category',
    entityId: category._id,
    entityName: category.name,
    description: `Updated pricing for "${category.name}"`,
    metadata: { basePrice, weekendPrice, holidayPrice, advancePercentage },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Pricing updated successfully',
    data: { category },
  });
};

module.exports = {
  getRoomCategoriesForLodge,
  getRoomCategoryById,
  checkAvailability,
  createRoomCategory,
  getOwnerRoomCategories,
  getOwnerRoomCategoryById,
  updateRoomCategory,
  deleteRoomCategory,
  updateAvailability,
  updatePricing,
};