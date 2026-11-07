/**
 * Admin Controller
 * Super admin dashboard and management endpoints
 */

const User = require('../models/User');
const Lodge = require('../models/Lodge');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const TransportRequest = require('../models/TransportRequest');
const Review = require('../models/Review');
const Settlement = require('../models/Settlement');
const Notification = require('../models/Notification');
const AdminSettings = require('../models/AdminSettings');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get admin dashboard statistics
 */
const getDashboard = async (req, res) => {
  const [
    totalUsers,
    totalCustomers,
    totalLodgeOwners,
    totalLodges,
    approvedLodges,
    pendingLodges,
    totalBookings,
    confirmedBookings,
    pendingPaymentBookings,
    totalPayments,
    verifiedPayments,
    pendingVerificationPayments,
    totalRevenue,
    totalComplaints,
    openComplaints,
    totalTransportRequests,
    pendingTransportRequests,
    totalReviews,
    pendingReviews,
    totalSettlements,
    pendingSettlements,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'super_admin' } }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'lodge_owner' }),
    Lodge.countDocuments(),
    Lodge.countDocuments({ status: 'approved' }),
    Lodge.countDocuments({ status: 'pending_approval' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: { $in: ['pending_payment', 'pending_verification'] } }),
    Payment.countDocuments(),
    Payment.countDocuments({ status: 'verified' }),
    Payment.countDocuments({ status: 'pending_verification' }),
    Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting_customer'] } }),
    TransportRequest.countDocuments(),
    TransportRequest.countDocuments({ status: { $in: ['pending', 'contacted'] } }),
    Review.countDocuments(),
    Review.countDocuments({ status: 'pending' }),
    Settlement.countDocuments(),
    Settlement.countDocuments({ status: 'pending' }),
  ]);

  const revenue = totalRevenue[0]?.total || 0;

  // Recent activity
  const recentBookings = await Booking.find()
    .populate('customer', 'fullName')
    .populate('lodge', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentPayments = await Payment.find({ status: 'pending_verification' })
    .populate('customer', 'fullName')
    .populate('lodge', 'name')
    .sort({ submittedAt: 1 })
    .limit(5);

  const recentComplaints = await Complaint.find({ status: { $in: ['open', 'in_progress'] } })
    .populate('customer', 'fullName')
    .populate('lodge', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          lodgeOwners: totalLodgeOwners,
        },
        lodges: {
          total: totalLodges,
          approved: approvedLodges,
          pending: pendingLodges,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          pendingPayment: pendingPaymentBookings,
        },
        payments: {
          total: totalPayments,
          verified: verifiedPayments,
          pendingVerification: pendingVerificationPayments,
          totalRevenue: revenue,
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints,
        },
        transport: {
          total: totalTransportRequests,
          pending: pendingTransportRequests,
        },
        reviews: {
          total: totalReviews,
          pending: pendingReviews,
        },
        settlements: {
          total: totalSettlements,
          pending: pendingSettlements,
        },
      },
      recent: {
        bookings: recentBookings,
        payments: recentPayments,
        complaints: recentComplaints,
      },
    },
  });
};

/**
 * Get all users
 */
const getUsers = async (req, res) => {
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
 * Get user by ID
 */
const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password -refreshToken');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  let profileData = {};
  if (user.role === 'customer') {
    const customer = await require('../models/Customer').findById(id);
    profileData = customer ? customer.toObject() : {};
  } else if (user.role === 'lodge_owner') {
    const owner = await require('../models/LodgeOwner').findById(id);
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
 * Update user
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { isActive, role, verificationStatus, ...updates } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role === 'super_admin') {
    throw new BadRequestError('Cannot modify super admin');
  }

  Object.keys(updates).forEach((key) => {
    if (key !== 'password' && key !== 'refreshToken') {
      user[key] = updates[key];
    }
  });

  if (isActive !== undefined) user.isActive = isActive;
  if (role && role !== 'super_admin') user.role = role;

  await user.save();

  if (user.role === 'lodge_owner' && verificationStatus) {
    const owner = await require('../models/LodgeOwner').findById(id);
    if (owner) {
      owner.verificationStatus = verificationStatus;
      owner.verifiedBy = req.user._id;
      owner.verifiedAt = new Date();
      await owner.save();
    }
  }

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
    throw new BadRequestError('Cannot delete super admin');
  }

  user.isActive = false;
  await user.save();

  await ActivityLog.logAuth(req.user, 'admin_user_delete', true, {
    targetUserId: id,
  });

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
};

/**
 * Get all lodges
 */
const getLodges = async (req, res) => {
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
 * Get lodge by ID
 */
const getLodgeById = async (req, res) => {
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
 * Approve lodge
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

  await Notification.createNotification({
    user: lodge.owner,
    type: 'lodge_approved',
    title: 'Lodge Approved!',
    message: `Your lodge "${lodge.name}" has been approved and is now visible to customers.`,
    relatedEntity: { entityType: 'lodge', entityId: lodge._id },
    priority: 'high',
  });

  const LodgeOwner = require('../models/LodgeOwner');
  const ownerProfile = await LodgeOwner.findOne({ _id: lodge.owner });
  if (ownerProfile) {
    ownerProfile.verificationStatus = 'approved';
    ownerProfile.verifiedBy = req.user._id;
    ownerProfile.verifiedAt = new Date();
    await ownerProfile.save();
  }

  await ActivityLog.logLodge(req.user, lodge, 'approve', { ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge approved successfully',
    data: { lodge },
  });
};

/**
 * Reject lodge
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

  await Notification.createNotification({
    user: lodge.owner,
    type: 'lodge_rejected',
    title: 'Lodge Rejected',
    message: `Your lodge "${lodge.name}" was rejected. Reason: ${reason}`,
    relatedEntity: { entityType: 'lodge', entityId: lodge._id },
    priority: 'high',
  });

  await ActivityLog.logLodge(req.user, lodge, 'reject', { rejectionReason: reason, ip: req.ip });

  res.json({
    success: true,
    message: 'Lodge rejected',
    data: { lodge },
  });
};

/**
 * Update lodge status
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
 * Get all bookings
 */
const getBookings = async (req, res) => {
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
 * Get pending payments
 */
const getPendingPayments = async (req, res) => {
  const { page = 1, limit = 20, lodgeId, startDate, endDate } = req.query;

  const filters = {};
  if (lodgeId) filters.lodge = lodgeId;
  if (startDate || endDate) {
    filters.submittedAt = {};
    if (startDate) filters.submittedAt.$gte = new Date(startDate);
    if (endDate) filters.submittedAt.$lte = new Date(endDate);
  }

  const payments = await Payment.getPendingVerifications(filters);

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = payments.slice(start, end);

  res.json({
    success: true,
    data: {
      payments: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length,
        pages: Math.ceil(payments.length / limit),
      },
    },
  });
};

/**
 * Verify/reject payment
 */
const verifyPayment = async (req, res) => {
  const { id } = req.params;
  const { action, notes, rejectionReason } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (!payment.canBeVerified) {
    throw new BadRequestError('Payment cannot be verified in current state');
  }

  let updatedPayment;
  if (action === 'approve') {
    updatedPayment = await payment.verify(req.user._id, notes || '');
  } else if (action === 'reject') {
    if (!rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }
    updatedPayment = await payment.reject(req.user._id, rejectionReason);
  } else {
    throw new BadRequestError('Invalid action');
  }

  await Notification.createNotification({
    user: payment.customer,
    type: action === 'approve' ? 'payment_verified' : 'payment_rejected',
    title: action === 'approve' ? 'Payment Verified' : 'Payment Rejected',
    message: action === 'approve'
      ? `Your payment for booking ${payment.booking.bookingId} has been verified. Your booking is now confirmed!`
      : `Your payment for booking ${payment.booking.bookingId} was rejected. Reason: ${rejectionReason}`,
    relatedEntity: { entityType: 'payment', entityId: payment._id },
    priority: 'high',
  });

  const lodge = await Lodge.findById(payment.lodge);
  if (lodge) {
    await Notification.createNotification({
      user: lodge.owner,
      type: action === 'approve' ? 'payment_verified' : 'payment_rejected',
      title: action === 'approve' ? 'Payment Verified' : 'Payment Rejected',
      message: `Payment for booking ${payment.booking.bookingId} has been ${action === 'approve' ? 'verified' : 'rejected'}.`,
      relatedEntity: { entityType: 'payment', entityId: payment._id },
      priority: 'normal',
    });
  }

  await ActivityLog.logPayment(req.user, updatedPayment, action === 'approve' ? 'verify' : 'reject', {
    notes,
    rejectionReason,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully`,
    data: { payment: updatedPayment },
  });
};

/**
 * Get all complaints
 */
const getComplaints = async (req, res) => {
  const { status, category, priority, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;

  const complaints = await Complaint.find(query)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .sort({ priority: -1, createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(query);

  res.json({
    success: true,
    data: {
      complaints,
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
 * Get all transport requests
 */
const getTransportRequests = async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;

  const requests = await TransportRequest.find(query)
    .populate('customer', 'fullName phone')
    .populate('booking', 'bookingId lodge')
    .populate('assignedTo', 'fullName')
    .sort({ preferredDateTime: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await TransportRequest.countDocuments(query);

  res.json({
    success: true,
    data: {
      requests,
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
 * Get pending reviews
 */
const getPendingReviews = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const reviews = await Review.find({ status: 'pending' })
    .populate('customer', 'fullName phone')
    .populate('lodge', 'name')
    .populate('booking', 'checkInDate checkOutDate bookingId')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ status: 'pending' });

  res.json({
    success: true,
    data: {
      reviews,
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
 * Approve review
 */
const approveReview = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await review.approve(req.user._id, notes || '');

  await Notification.createNotification({
    user: review.customer,
    type: 'review_approved',
    title: 'Review Approved',
    message: `Your review for ${review.lodge.name} has been approved and is now visible.`,
    relatedEntity: { entityType: 'review', entityId: review._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'approve_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Approved review for ${review.lodge.name}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Review approved successfully',
    data: { review },
  });
};

/**
 * Reject review
 */
const rejectReview = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!notes) {
    throw new BadRequestError('Rejection reason is required');
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await review.reject(req.user._id, notes);

  await Notification.createNotification({
    user: review.customer,
    type: 'review_approved',
    title: 'Review Rejected',
    message: `Your review for ${review.lodge.name} was rejected. Reason: ${notes}`,
    relatedEntity: { entityType: 'review', entityId: review._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'reject_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Rejected review for ${review.lodge.name}. Reason: ${notes}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Review rejected',
    data: { review },
  });
};

/**
 * Get all settlements
 */
const getSettlements = async (req, res) => {
  const { status, lodgeOwnerId, lodgeId, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (lodgeOwnerId) query.lodgeOwner = lodgeOwnerId;
  if (lodgeId) query.lodge = lodgeId;

  const settlements = await Settlement.find(query)
    .populate('lodgeOwner', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .populate('payment', 'paymentId')
    .populate('processedBy', 'fullName')
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
 * Complete settlement
 */
const completeSettlement = async (req, res) => {
  const { id } = req.params;
  const { transactionRef, paymentMethod = 'bank_transfer' } = req.body;

  if (!transactionRef) {
    throw new BadRequestError('Transaction reference is required');
  }

  const settlement = await Settlement.findById(id);
  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  if (!['pending', 'processing'].includes(settlement.status)) {
    throw new BadRequestError('Settlement cannot be completed in current state');
  }

  await settlement.complete(req.user._id, transactionRef, paymentMethod);

  await Notification.createNotification({
    user: settlement.lodgeOwner,
    type: 'settlement_processed',
    title: 'Settlement Completed',
    message: `Settlement ${settlement.settlementId} of ₹${settlement.settlementAmount} has been processed.`,
    relatedEntity: { entityType: 'settlement', entityId: settlement._id },
    priority: 'high',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'complete_settlement',
    actionCategory: 'settlement',
    entityType: 'settlement',
    entityId: settlement._id,
    entityName: settlement.settlementId,
    description: `Completed settlement ${settlement.settlementId} with transaction ${transactionRef}`,
    metadata: { transactionRef, paymentMethod },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Settlement completed successfully',
    data: { settlement },
  });
};

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getLodges,
  getLodgeById,
  approveLodge,
  rejectLodge,
  updateLodgeStatus,
  getBookings,
  getPendingPayments,
  verifyPayment,
  getComplaints,
  getTransportRequests,
  getPendingReviews,
  approveReview,
  rejectReview,
  getSettlements,
  completeSettlement,
};