/**
 * Lodge Controller
 * Handles lodge CRUD, search, approval, and management
 */

const Lodge = require('../models/Lodge');
const RoomCategory = require('../models/RoomCategory');
const RoomInventory = require('../models/RoomInventory');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const AdminSettings = require('../models/AdminSettings');
const { uploadLodgeImage, uploadLodgeDocument, deleteFile } = require('../utils/cloudinary');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Search lodges (public)
 */
const searchLodges = async (req, res) => {
  const {
    checkInDate,
    checkOutDate,
    adults = 1,
    children = 0,
    rooms = 1,
    minPrice,
    maxPrice,
    acType,
    parking,
    page = 1,
    limit = 10,
    sort = 'rating',
    search,
  } = req.query;

  const filters = {};
  if (minPrice || maxPrice) filters.basePrice = {};
  if (minPrice) filters.basePrice.$gte = parseFloat(minPrice);
  if (maxPrice) filters.basePrice.$lte = parseFloat(maxPrice);

  if (acType) filters.acType = acType;
  if (parking === 'true') filters['facilities.parking'] = true;

  // Get lodges matching basic criteria
  let lodges = await Lodge.search({
    ...filters,
    search,
  });

  // If dates provided, filter by availability
  if (checkInDate && checkOutDate) {
    const availableLodges = [];

    for (const lodge of lodges) {
      const categories = await RoomCategory.getWithAvailability(
        lodge._id,
        checkInDate,
        checkOutDate,
        {
          acType,
          minCapacity: parseInt(adults) + parseInt(children),
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          onlyAvailable: true,
        }
      );

      if (categories.length > 0) {
        availableLodges.push({
          ...lodge.toObject(),
          availableCategories: categories,
          minPrice: Math.min(...categories.map(c => c.priceInfo.total)),
        });
      }
    }

    // Sort results
    if (sort === 'price_asc') {
      availableLodges.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sort === 'price_desc') {
      availableLodges.sort((a, b) => b.minPrice - a.minPrice);
    } else if (sort === 'rating') {
      availableLodges.sort((a, b) => b.rating.average - a.rating.average);
    } else if (sort === 'distance') {
      availableLodges.sort((a, b) => (a.address.distanceFromTemple || 0) - (b.address.distanceFromTemple || 0));
    } else if (sort === 'newest') {
      availableLodges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Paginate
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = availableLodges.slice(start, end);

    return res.json({
      success: true,
      data: {
        lodges: paginated,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: availableLodges.length,
          pages: Math.ceil(availableLodges.length / limit),
        },
      },
    });
  }

  // No dates - return basic lodge list with sorting
  if (sort === 'rating') {
    lodges.sort((a, b) => b.rating.average - a.rating.average);
  } else if (sort === 'distance') {
    lodges.sort((a, b) => (a.address.distanceFromTemple || 0) - (b.address.distanceFromTemple || 0));
  } else if (sort === 'newest') {
    lodges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = lodges.slice(start, end);

  res.json({
    success: true,
    data: {
      lodges: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: lodges.length,
        pages: Math.ceil(lodges.length / limit),
      },
    },
  });
};

/**
 * Get featured lodges
 */
const getFeaturedLodges = async (req, res) => {
  const lodges = await Lodge.find({ isFeatured: true, status: 'approved' })
    .sort({ priority: -1, 'rating.average': -1 })
    .limit(10)
    .select('name slug address description images rating pricing basePrice facilities');

  res.json({
    success: true,
    data: { lodges },
  });
};

/**
 * Get nearby lodges
 */
const getNearbyLodges = async (req, res) => {
  const { longitude, latitude, maxDistance = 10, limit = 10 } = req.query;

  if (!longitude || !latitude) {
    throw new BadRequestError('Coordinates are required');
  }

  const coordinates = [parseFloat(longitude), parseFloat(latitude)];

  const lodges = await Lodge.find({
    status: 'approved',
    'address.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: parseFloat(maxDistance) * 1000,
      },
    },
  })
    .select('name slug address description images rating pricing basePrice facilities distanceFromTemple')
    .limit(parseInt(limit));

  // Calculate actual distances
  const lodgesWithDistance = lodges.map(lodge => {
    const distance = calculateDistance(coordinates, lodge.address.coordinates);
    return {
      ...lodge.toObject(),
      distance: Math.round(distance * 10) / 10,
    };
  });

  lodgesWithDistance.sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    data: { lodges: lodgesWithDistance },
  });
};

/**
 * Get lodge by ID (public)
 */
const getLodgeById = async (req, res) => {
  const { id } = req.params;

  const lodge = await Lodge.findOne({ _id: id, status: 'approved' })
    .populate('owner', 'fullName phone verificationStatus')
    .populate({
      path: 'roomCategories',
      match: { isActive: true },
      populate: {
        path: 'lodge',
        select: 'name',
      },
    });

  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  // Get reviews
  const reviews = await Review.getApprovedForLodge(lodge._id, { limit: 5 });
  const reviewStats = await Review.getStatisticsForLodge(lodge._id);

  res.json({
    success: true,
    data: {
      lodge: {
        ...lodge.toObject(),
        reviews,
        reviewStats,
      },
    },
  });
};

/**
 * Check lodge availability for dates
 */
const checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate, adults = 1, children = 0 } = req.query;

  if (!checkInDate || !checkOutDate) {
    throw new BadRequestError('Check-in and check-out dates are required');
  }

  const lodge = await Lodge.findOne({ _id: id, status: 'approved' });
  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  const categories = await RoomCategory.getWithAvailability(
    lodge._id,
    checkInDate,
    checkOutDate,
    {
      minCapacity: parseInt(adults) + parseInt(children),
      onlyAvailable: true,
    }
  );

  res.json({
    success: true,
    data: {
      lodge: {
        id: lodge._id,
        name: lodge.name,
        checkInTime: lodge.policies.checkInTime,
        checkOutTime: lodge.policies.checkOutTime,
      },
      categories,
      checkInDate,
      checkOutDate,
    },
  });
};

/**
 * Create new lodge (owner)
 */
const createLodge = async (req, res) => {
  const owner = req.user;

  // Check if owner is verified
  const ownerProfile = await require('../models/LodgeOwner').findById(owner._id);
  if (ownerProfile.verificationStatus !== 'approved') {
    throw new ForbiddenError('Your account must be verified before creating lodges');
  }

  // Process uploaded images
  const images = [];
  if (req.files && req.files.images) {
    for (let i = 0; i < req.files.images.length; i++) {
      const file = req.files.images[i];
      const result = await uploadLodgeImage(file.buffer, owner._id.toString());
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
        folder: `yadadri-stay/lodges/${owner._id}`,
        resource_type: 'video',
      });
      videos.push({
        url: result.secure_url,
        publicId: result.public_id,
        order: i,
      });
    }
  }

  const lodgeData = {
    ...req.body,
    owner: owner._id,
    images,
    videos,
    status: 'draft',
  };

  const lodge = await Lodge.create(lodgeData);

  // Log activity
  await ActivityLog.logLodge(owner, lodge, 'create', { ip: req.ip });

  res.status(201).json({
    success: true,
    message: 'Lodge created successfully',
    data: { lodge },
  });
};

/**
 * Get owner's lodges
 */
const getOwnerLodges = async (req, res) => {
  const lodges = await Lodge.find({ owner: req.user._id })
    .populate('roomCategories', 'name type acType totalRooms isActive')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { lodges },
  });
};

/**
 * Get owner's lodge by ID
 */
const getOwnerLodgeById = async (req, res) => {
  const lodge = req.lodge;

  // Populate room categories with stats
  const categories = await RoomCategory.find({ lodge: lodge._id })
    .sort({ displayOrder: 1 });

  res.json({
    success: true,
    data: {
      lodge: {
        ...lodge.toObject(),
        roomCategories: categories,
      },
    },
  });
};

/**
 * Update owner's lodge
 */
const updateLodge = async (req, res) => {
  const lodge = req.lodge;

  // If lodge is approved, only allow certain updates
  if (lodge.status === 'approved') {
    const allowedUpdates = [
      'description', 'shortDescription', 'contact', 'facilities',
      'policies', 'pricing', 'seo', 'images', 'videos',
    ];
    const updates = {};
    allowedUpdates.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    Object.assign(lodge, updates);
  } else {
    // Draft or pending - allow more updates
    Object.assign(lodge, req.body);
  }

  // Process new images
  if (req.files && req.files.images) {
    const existingCount = lodge.images.length;
    for (let i = 0; i < req.files.images.length; i++) {
      const file = req.files.images[i];
      const result = await uploadLodgeImage(file.buffer, lodge._id.toString());
      lodge.images.push({
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: existingCount === 0 && i === 0,
        order: existingCount + i,
      });
    }
  }

  // Process new videos
  if (req.files && req.files.videos) {
    const existingCount = lodge.videos.length;
    for (let i = 0; i < req.files.videos.length; i++) {
      const file = req.files.videos[i];
      const result = await require('../utils/cloudinary').uploadFile(file.path, {
        folder: `yadadri-stay/lodges/${lodge._id}`,
        resource_type: 'video',
      });
      lodge.videos.push({
        url: result.secure_url,
        publicId: result.public_id,
        order: existingCount + i,
      });
    }
  }

  lodge.lastUpdatedBy = req.user._id;
  await lodge.save();

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'update', { ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge updated successfully',
    data: { lodge },
  });
};

/**
 * Delete/deactivate owner's lodge
 */
const deleteLodge = async (req, res) => {
  const lodge = req.lodge;

  // Check for active bookings
  const activeBookings = await Booking.countDocuments({
    lodge: lodge._id,
    status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] },
    checkOutDate: { $gte: new Date() },
  });

  if (activeBookings > 0) {
    throw new ConflictError('Cannot delete lodge with active bookings');
  }

  // Soft delete
  lodge.status = 'deactivated';
  await lodge.save();

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'deactivate', { ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge deactivated successfully',
  });
};

/**
 * Upload lodge documents
 */
const uploadDocuments = async (req, res) => {
  const lodge = req.lodge;

  const documentFields = ['gstCertificate', 'panCard', 'aadhaarCard', 'bankPassbook', 'ownershipProof'];
  const uploaded = {};

  for (const field of documentFields) {
    if (req.files && req.files[field] && req.files[field][0]) {
      const file = req.files[field][0];
      const result = await uploadLodgeDocument(file.buffer, lodge._id.toString(), field);
      lodge.documents[field] = result.secure_url;
      uploaded[field] = result.secure_url;
    }
  }

  await lodge.save();

  res.json({
    success: true,
    message: 'Documents uploaded successfully',
    data: { uploaded },
  });
};

/**
 * Submit lodge for approval
 */
const submitForApproval = async (req, res) => {
  const lodge = req.lodge;

  // Validate required fields
  const required = ['name', 'address.street', 'address.city', 'address.pincode', 'contact.phone'];
  for (const field of required) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], lodge);
    if (!value) {
      throw new BadRequestError(`Required field missing: ${field}`);
    }
  }

  // Check for at least one image
  if (lodge.images.length === 0) {
    throw new BadRequestError('At least one lodge image is required');
  }

  // Check for at least one room category
  const categories = await RoomCategory.countDocuments({ lodge: lodge._id, isActive: true });
  if (categories === 0) {
    throw new BadRequestError('At least one room category is required');
  }

  lodge.status = 'pending_approval';
  await lodge.save();

  // Notify admins
  const admins = await require('../models/User').find({ role: 'super_admin', isActive: true });
  for (const admin of admins) {
    await Notification.createNotification({
      user: admin._id,
      type: 'lodge_approved',
      title: 'New Lodge Submission',
      message: `Lodge "${lodge.name}" has been submitted for approval`,
      relatedEntity: { entityType: 'lodge', entityId: lodge._id },
      actionUrl: `/admin/lodges/${lodge._id}`,
      actionText: 'Review',
      priority: 'normal',
    });
  }

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'submit_approval', { ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge submitted for approval',
    data: { lodge },
  });
};

/**
 * Get all lodges (admin)
 */
const getAllLodges = async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }

  const lodges = await Lodge.find(query)
    .populate('owner', 'fullName phone email verificationStatus')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Lodge.countDocuments(query);

  res.json({
    success: true,
    data: {
      lodges,
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
 * Get lodge by ID (admin)
 */
const getLodgeByIdAdmin = async (req, res) => {
  const { id } = req.params;

  const lodge = await Lodge.findById(id)
    .populate('owner', 'fullName phone email verificationStatus bankDetails')
    .populate('roomCategories');

  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  res.json({
    success: true,
    data: { lodge },
  });
};

/**
 * Approve lodge (admin)
 */
const approveLodge = async (req, res) => {
  const { id } = req.params;

  const lodge = await Lodge.findById(id);
  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  if (lodge.status === 'approved') {
    throw new BadRequestError('Lodge is already approved');
  }

  lodge.status = 'approved';
  lodge.approvedBy = req.user._id;
  lodge.approvedAt = new Date();
  lodge.publishedAt = new Date();
  await lodge.save();

  // Notify owner
  await Notification.createNotification({
    user: lodge.owner,
    type: 'lodge_approved',
    title: 'Lodge Approved!',
    message: `Your lodge "${lodge.name}" has been approved and is now visible to customers.`,
    relatedEntity: { entityType: 'lodge', entityId: lodge._id },
    priority: 'high',
  });

  // Update owner's lodge owner profile
  const LodgeOwner = require('../models/LodgeOwner');
  const ownerProfile = await LodgeOwner.findOne({ _id: lodge.owner });
  if (ownerProfile) {
    ownerProfile.verificationStatus = 'approved';
    ownerProfile.verifiedBy = req.user._id;
    ownerProfile.verifiedAt = new Date();
    await ownerProfile.save();
  }

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'approve', { ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge approved successfully',
    data: { lodge },
  });
};

/**
 * Reject lodge (admin)
 */
const rejectLodge = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new BadRequestError('Rejection reason is required');
  }

  const lodge = await Lodge.findById(id);
  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  lodge.status = 'rejected';
  lodge.rejectedBy = req.user._id;
  lodge.rejectedAt = new Date();
  lodge.rejectionReason = reason;
  await lodge.save();

  // Notify owner
  await Notification.createNotification({
    user: lodge.owner,
    type: 'lodge_rejected',
    title: 'Lodge Rejected',
    message: `Your lodge "${lodge.name}" was rejected. Reason: ${reason}`,
    relatedEntity: { entityType: 'lodge', entityId: lodge._id },
    priority: 'high',
  });

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'reject', { rejectionReason: reason, ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge rejected',
    data: { lodge },
  });
};

/**
 * Update lodge status (admin)
 */
const updateLodgeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['draft', 'pending_approval', 'approved', 'rejected', 'suspended', 'deactivated'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Invalid status');
  }

  const lodge = await Lodge.findById(id);
  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  const oldStatus = lodge.status;
  lodge.status = status;

  if (status === 'approved' && oldStatus !== 'approved') {
    lodge.approvedBy = req.user._id;
    lodge.approvedAt = new Date();
    lodge.publishedAt = new Date();
  }

  await lodge.save();

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'status_change', {
    oldStatus,
    newStatus: status,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Lodge status updated',
    data: { lodge },
  });
};

/**
 * Delete lodge (admin)
 */
const deleteLodgeAdmin = async (req, res) => {
  const { id } = req.params;

  const lodge = await Lodge.findById(id);
  if (!lodge) {
    throw new NotFoundError('Lodge not found');
  }

  // Check for active bookings
  const activeBookings = await Booking.countDocuments({
    lodge: lodge._id,
    status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] },
    checkOutDate: { $gte: new Date() },
  });

  if (activeBookings > 0) {
    throw new ConflictError('Cannot delete lodge with active bookings');
  }

  // Delete associated data
  await RoomCategory.deleteMany({ lodge: lodge._id });
  await RoomInventory.deleteMany({ lodge: lodge._id });

  // Delete lodge images from Cloudinary
  for (const image of lodge.images) {
    if (image.publicId) await deleteFile(image.publicId);
  }
  for (const video of lodge.videos) {
    if (video.publicId) await deleteFile(video.publicId, 'video');
  }

  await lodge.deleteOne();

  // Log activity
  await ActivityLog.logLodge(req.user, lodge, 'delete', { ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge deleted permanently',
  });
};

/**
 * Calculate distance between two coordinates
 */
function calculateDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  searchLodges,
  getFeaturedLodges,
  getNearbyLodges,
  getLodgeById,
  checkAvailability,
  createLodge,
  getOwnerLodges,
  getOwnerLodgeById,
  updateLodge,
  deleteLodge,
  uploadDocuments,
  submitForApproval,
  getAllLodges,
  getLodgeByIdAdmin,
  approveLodge,
  rejectLodge,
  updateLodgeStatus,
  deleteLodgeAdmin,
};