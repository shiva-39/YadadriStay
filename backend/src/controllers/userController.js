/**
 * User Controller
 * Handles user dashboard, profiles, and role-specific data
 */

const User = require('../models/User');
const Customer = require('../models/Customer');
const LodgeOwner = require('../models/LodgeOwner');
const Lodge = require('../models/Lodge');
const RoomCategory = require('../models/RoomCategory');
const RoomInventory = require('../models/RoomInventory');
const Booking = require('../models/Booking');
const OfflineBooking = require('../models/OfflineBooking');
const Payment = require('../models/Payment');
const Settlement = require('../models/Settlement');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const TransportRequest = require('../models/TransportRequest');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { uploadProfileImage: uploadProfileImageUtil } = require('../utils/cloudinary');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * Get user dashboard based on role
 */
const getDashboard = async (req, res) => {
  const user = req.user;
  let dashboardData = {};

  if (user.role === 'customer') {
    const customer = await Customer.findById(user._id);
    const stats = await customer.getDashboardStats();

    const upcomingBookings = await Booking.find({
      customer: user._id,
      status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] },
      checkOutDate: { $gte: new Date() },
    })
      .populate('lodge', 'name address contact')
      .populate('roomCategory', 'name')
      .sort({ checkInDate: 1 })
      .limit(5);

    const pendingPayments = await Payment.find({
      customer: user._id,
      status: 'pending_verification',
    }).populate('booking', 'bookingId checkInDate checkOutDate');

    dashboardData = {
      stats,
      upcomingBookings,
      pendingPayments: pendingPayments.length,
      loyaltyPoints: customer.loyaltyPoints,
      walletBalance: customer.walletBalance,
    };
  } else if (user.role === 'lodge_owner') {
    const owner = await LodgeOwner.findById(user._id);
    const stats = await owner.getDashboardStats();

    const pendingPayments = await Payment.find({
      lodge: { $in: await Lodge.find({ owner: user._id }).distinct('_id') },
      status: 'pending_verification',
    }).populate('booking', 'bookingId checkInDate checkOutDate');

    dashboardData = {
      stats,
      pendingPayments: pendingPayments.length,
      verificationStatus: owner.verificationStatus,
    };
  } else if (user.role === 'super_admin') {
    // Admin dashboard stats
    const [
      totalUsers,
      totalLodges,
      pendingApprovals,
      totalBookings,
      pendingPayments,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      Lodge.countDocuments(),
      Lodge.countDocuments({ status: 'pending_approval' }),
      Booking.countDocuments(),
      Payment.countDocuments({ status: 'pending_verification' }),
      Payment.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    dashboardData = {
      stats: {
        totalUsers,
        totalLodges,
        pendingApprovals,
        totalBookings,
        pendingPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    };
  }

  res.json({
    success: true,
    data: dashboardData,
  });
};

/**
 * Get detailed user profile
 */
const getProfile = async (req, res) => {
  const user = req.user;
  let profileData = {};

  if (user.role === 'customer') {
    const customer = await Customer.findById(user._id);
    profileData = customer ? customer.toObject() : {};
  } else if (user.role === 'lodge_owner') {
    const owner = await LodgeOwner.findById(user._id);
    profileData = owner ? owner.toObject() : {};
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        language: user.language,
        profileImage: user.profileImage,
        address: user.address,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        ...profileData,
      },
    },
  });
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  const user = req.user;
  const { fullName, email, dateOfBirth, gender, language, address, emergencyContact, preferences } = req.body;

  // Update base user fields
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (language) user.language = language;
  if (address) user.address = { ...user.address, ...address };

  await user.save();

  // Update role-specific profile
  if (user.role === 'customer') {
    const customer = await Customer.findById(user._id);
    if (customer) {
      if (dateOfBirth) customer.dateOfBirth = dateOfBirth;
      if (gender) customer.gender = gender;
      if (emergencyContact) customer.emergencyContact = emergencyContact;
      if (preferences) customer.preferences = { ...customer.preferences, ...preferences };
      await customer.save();
    }
  }

  // Log activity
  await ActivityLog.logAuth(user, 'profile_update', true, { ip: req.ip });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: await getProfile(req, res) },
  });
};

/**
 * Upload profile image
 */
const uploadProfileImage = async (req, res) => {
  const user = req.user;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided',
      code: 'NO_FILE',
    });
  }

  try {
    const result = await uploadProfileImageUtil(req.file.buffer, user._id.toString());

    user.profileImage = result.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image updated',
      data: { profileImage: result.secure_url },
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      code: 'UPLOAD_FAILED',
    });
  }
};

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  const { limit = 20, skip = 0, unreadOnly = false } = req.query;

  const notifications = await Notification.getForUser(req.user._id, {
    limit: parseInt(limit),
    skip: parseInt(skip),
    unreadOnly: unreadOnly === 'true',
  });

  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: notifications.length === parseInt(limit),
      },
    },
  });
};

/**
 * Mark notification as read
 */
const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsRead = async (req, res) => {
  await Notification.markAllAsRead(req.user._id);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
};

/**
 * Get customer bookings
 */
const getCustomerBookings = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { customer: req.user._id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('lodge', 'name address contact phone images')
    .populate('roomCategory', 'name type acType')
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
 * Get booking details
 */
const getBookingDetails = async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findOne({ _id: id, customer: req.user._id })
    .populate('lodge', 'name address contact phone images policies')
    .populate('roomCategory', 'name type acType capacity amenities images')
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
 * Get customer reviews
 */
const getCustomerReviews = async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate('lodge', 'name')
    .populate('roomCategory', 'name')
    .populate('booking', 'checkInDate checkOutDate')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { reviews },
  });
};

/**
 * Get customer complaints
 */
const getCustomerComplaints = async (req, res) => {
  const complaints = await Complaint.find({ customer: req.user._id })
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { complaints },
  });
};

/**
 * Get customer transport requests
 */
const getCustomerTransportRequests = async (req, res) => {
  const requests = await TransportRequest.find({ customer: req.user._id })
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { requests },
  });
};

/**
 * Get owner's lodges
 */
const getOwnerLodges = async (req, res) => {
  const lodges = await Lodge.find({ owner: req.user._id })
    .populate('roomCategories')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { lodges },
  });
};

/**
 * Get owner dashboard statistics
 */
const getOwnerStats = async (req, res) => {
  const owner = await LodgeOwner.findById(req.user._id);
  const stats = await owner.getDashboardStats();

  res.json({
    success: true,
    data: { stats },
  });
};

/**
 * Get bookings for owner's lodges
 */
const getOwnerBookings = async (req, res) => {
  const { status, lodgeId, page = 1, limit = 20 } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (status) query.status = status;
  if (lodgeId) query.lodge = lodgeId;

  const bookings = await Booking.find(query)
    .populate('customer', 'fullName phone')
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
 * Get offline bookings for owner's lodges
 */
const getOwnerOfflineBookings = async (req, res) => {
  const { status, lodgeId, page = 1, limit = 20 } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (status) query.status = status;
  if (lodgeId) query.lodge = lodgeId;

  const bookings = await OfflineBooking.find(query)
    .populate('lodge', 'name')
    .populate('roomCategory', 'name')
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
 * Get payments for owner's lodges
 */
const getOwnerPayments = async (req, res) => {
  const { status, lodgeId, page = 1, limit = 20 } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (status) query.status = status;
  if (lodgeId) query.lodge = lodgeId;

  const payments = await Payment.find(query)
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .populate('customer', 'fullName phone')
    .populate('lodge', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    data: {
      payments,
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
 * Get settlements for owner
 */
const getOwnerSettlements = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { lodgeOwner: req.user._id };
  if (status) query.status = status;

  const settlements = await Settlement.find(query)
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .populate('lodge', 'name')
    .populate('payment', 'paymentId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Settlement.countDocuments(query);

  res.json({
    success: true,
    data: {
      settlements,
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
 * Get all users (admin)
 */
const getAllUsers = async (req, res) => {
  const { role, isActive, page = 1, limit = 20, search } = req.query;

  const query = { role: { $ne: 'super_admin' } };
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
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
 * Get user by ID (admin)
 */
const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password -refreshToken');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  let profileData = {};
  if (user.role === 'customer') {
    const customer = await Customer.findById(id);
    profileData = customer ? customer.toObject() : {};
  } else if (user.role === 'lodge_owner') {
    const owner = await LodgeOwner.findById(id);
    profileData = owner ? owner.toObject() : {};
  }

  res.json({
    success: true,
    data: {
      user: {
        ...user.toObject(),
        ...profileData,
      },
    },
  });
};

/**
 * Update user by admin
 */
const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { isActive, role, verificationStatus, ...updates } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent admin from modifying super admin
  if (user.role === 'super_admin') {
    throw new ForbiddenError('Cannot modify super admin');
  }

  // Update user fields
  Object.keys(updates).forEach((key) => {
    if (key !== 'password' && key !== 'refreshToken') {
      user[key] = updates[key];
    }
  });

  if (isActive !== undefined) user.isActive = isActive;
  if (role && role !== 'super_admin') user.role = role;

  await user.save();

  // Update role-specific profile
  if (user.role === 'lodge_owner' && verificationStatus) {
    const owner = await LodgeOwner.findById(id);
    if (owner) {
      owner.verificationStatus = verificationStatus;
      await owner.save();
    }
  }

  // Log activity
  await ActivityLog.logAuth(req.user, 'admin_user_update', true, {
    targetUserId: id,
    changes: updates,
  });

  res.json({
    success: true,
    message: 'User updated successfully',
  });
};

/**
 * Delete/deactivate user
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role === 'super_admin') {
    throw new ForbiddenError('Cannot delete super admin');
  }

  // Soft delete - deactivate
  user.isActive = false;
  await user.save();

  // Log activity
  await ActivityLog.logAuth(req.user, 'admin_user_delete', true, {
    targetUserId: id,
  });

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  uploadProfileImage,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getCustomerBookings,
  getBookingDetails,
  getCustomerReviews,
  getCustomerComplaints,
  getCustomerTransportRequests,
  getOwnerLodges,
  getOwnerStats,
  getOwnerBookings,
  getOwnerOfflineBookings,
  getOwnerPayments,
  getOwnerSettlements,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
};