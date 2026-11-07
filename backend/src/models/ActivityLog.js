/**
 * Activity Log Model
 * Audit trail for important actions
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // Actor
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userRole: {
      type: String,
      enum: ['customer', 'lodge_owner', 'super_admin', 'system'],
    },
    userName: String, // Denormalized for quick display
    userIp: String,
    userAgent: String,

    // Action
    action: {
      type: String,
      required: [true, 'Action is required'],
      index: true,
    },
    actionCategory: {
      type: String,
      enum: [
        'auth',
        'booking',
        'payment',
        'lodge',
        'room',
        'inventory',
        'review',
        'complaint',
        'transport',
        'settlement',
        'user_management',
        'settings',
        'report',
        'system',
      ],
      required: true,
      index: true,
    },

    // Target Entity
    entityType: {
      type: String,
      enum: [
        'user',
        'customer',
        'lodge_owner',
        'lodge',
        'room_category',
        'room_inventory',
        'booking',
        'offline_booking',
        'payment',
        'settlement',
        'review',
        'complaint',
        'transport_request',
        'notification',
        'admin_settings',
      ],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    entityName: String, // Denormalized for quick display

    // Details
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,

    // Severity
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
      index: true,
    },

    // Error Details (if failure)
    error: {
      code: String,
      message: String,
      stack: String,
    },

    // Correlation
    correlationId: {
      type: String,
      index: true,
    },
    sessionId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ actionCategory: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ correlationId: 1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index - keep logs for 1 year
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static method to log activity
activityLogSchema.statics.log = async function (data) {
  const {
    user,
    userRole,
    userName,
    userIp,
    userAgent,
    action,
    actionCategory,
    entityType,
    entityId,
    entityName,
    description,
    oldValues,
    newValues,
    metadata,
    severity = 'info',
    status = 'success',
    error,
    correlationId,
    sessionId,
  } = data;

  // Don't log if user is not provided and it's not a system action
  if (!user && userRole !== 'system') return null;

  return this.create({
    user,
    userRole,
    userName,
    userIp,
    userAgent,
    action,
    actionCategory,
    entityType,
    entityId,
    entityName,
    description,
    oldValues,
    newValues,
    metadata,
    severity,
    status,
    error,
    correlationId,
    sessionId,
  });
};

// Static method to log auth events
activityLogSchema.statics.logAuth = async function (user, action, success, details = {}) {
  return this.log({
    user: user._id,
    userRole: user.role,
    userName: user.fullName,
    userIp: details.ip,
    userAgent: details.userAgent,
    action,
    actionCategory: 'auth',
    entityType: 'user',
    entityId: user._id,
    entityName: user.fullName,
    description: `${action.replace(/_/g, ' ')} ${success ? 'successful' : 'failed'}`,
    status: success ? 'success' : 'failure',
    error: success ? undefined : { message: details.error },
    metadata: details,
  });
};

// Static method to log booking events
activityLogSchema.statics.logBooking = async function (user, booking, action, details = {}) {
  return this.log({
    user: user._id,
    userRole: user.role,
    userName: user.fullName,
    userIp: details.ip,
    userAgent: details.userAgent,
    action,
    actionCategory: 'booking',
    entityType: 'booking',
    entityId: booking._id,
    entityName: booking.bookingId,
    description: `${action.replace(/_/g, ' ')} for booking ${booking.bookingId}`,
    oldValues: details.oldValues,
    newValues: details.newValues,
    metadata: details,
    severity: ['cancelled', 'refunded'].includes(action) ? 'warning' : 'info',
  });
};

// Static method to log payment events
activityLogSchema.statics.logPayment = async function (user, payment, action, details = {}) {
  return this.log({
    user: user._id,
    userRole: user.role,
    userName: user.fullName,
    userIp: details.ip,
    userAgent: details.userAgent,
    action,
    actionCategory: 'payment',
    entityType: 'payment',
    entityId: payment._id,
    entityName: payment.paymentId,
    description: `${action.replace(/_/g, ' ')} for payment ${payment.paymentId}`,
    oldValues: details.oldValues,
    newValues: details.newValues,
    metadata: details,
    severity: action === 'rejected' ? 'warning' : 'info',
  });
};

// Static method to log lodge events
activityLogSchema.statics.logLodge = async function (user, lodge, action, details = {}) {
  return this.log({
    user: user._id,
    userRole: user.role,
    userName: user.fullName,
    userIp: details.ip,
    userAgent: details.userAgent,
    action,
    actionCategory: 'lodge',
    entityType: 'lodge',
    entityId: lodge._id,
    entityName: lodge.name,
    description: `${action.replace(/_/g, ' ')} for lodge ${lodge.name}`,
    oldValues: details.oldValues,
    newValues: details.newValues,
    metadata: details,
  });
};

// Static method to get activity logs
activityLogSchema.statics.getLogs = function (filters = {}, options = {}) {
  const { limit = 50, skip = 0, sort = '-createdAt' } = options;
  const query = {};

  if (filters.user) query.user = filters.user;
  if (filters.userRole) query.userRole = filters.userRole;
  if (filters.action) query.action = filters.action;
  if (filters.actionCategory) query.actionCategory = filters.actionCategory;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.severity) query.severity = filters.severity;
  if (filters.status) query.status = filters.status;
  if (filters.correlationId) query.correlationId = filters.correlationId;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  return this.find(query)
    .populate('user', 'fullName phone role')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get statistics
activityLogSchema.statics.getStatistics = async function (filters = {}) {
  const matchStage = {};

  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }

  if (filters.actionCategory) matchStage.actionCategory = filters.actionCategory;
  if (filters.severity) matchStage.severity = filters.severity;

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$actionCategory',
        count: { $sum: 1 },
        successCount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failureCount: { $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);