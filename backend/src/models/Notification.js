/**
 * Notification Model
 * In-app notifications for users
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // References
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    // Type and Category
    type: {
      type: String,
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'booking_reminder',
        'checkin_reminder',
        'checkout_reminder',
        'payment_received',
        'payment_verified',
        'payment_rejected',
        'payment_pending',
        'review_received',
        'review_approved',
        'complaint_update',
        'complaint_resolved',
        'transport_arranged',
        'transport_completed',
        'settlement_processed',
        'lodge_approved',
        'lodge_rejected',
        'price_change',
        'availability_update',
        'system_announcement',
        'promotional',
        'security_alert',
      ],
      required: [true, 'Notification type is required'],
      index: true,
    },
    category: {
      type: String,
      enum: ['booking', 'payment', 'review', 'complaint', 'transport', 'settlement', 'lodge', 'system', 'marketing', 'security'],
      required: true,
      index: true,
    },
    // Content
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    // Related Entity
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['booking', 'payment', 'review', 'complaint', 'transport', 'settlement', 'lodge', 'room_category'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    // Action
    actionUrl: String,
    actionText: String,
    // Priority
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    // Delivery
    delivery: {
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      pushSent: { type: Boolean, default: false },
      pushSentAt: Date,
      email: { type: Boolean, default: false },
      emailSent: { type: Boolean, default: false },
      emailSentAt: Date,
      sms: { type: Boolean, default: false },
      smsSent: { type: Boolean, default: false },
      smsSentAt: Date,
      whatsapp: { type: Boolean, default: false },
      whatsappSent: { type: Boolean, default: false },
      whatsappSentAt: Date,
    },
    // Metadata
    metadata: mongoose.Schema.Types.Mixed,
    // Expiry
    expiresAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  const {
    user,
    type,
    title,
    message,
    relatedEntity,
    actionUrl,
    actionText,
    priority = 'normal',
    delivery = {},
    metadata,
    expiresAt,
  } = data;

  const categoryMap = {
    booking_confirmed: 'booking',
    booking_cancelled: 'booking',
    booking_reminder: 'booking',
    checkin_reminder: 'booking',
    checkout_reminder: 'booking',
    payment_received: 'payment',
    payment_verified: 'payment',
    payment_rejected: 'payment',
    payment_pending: 'payment',
    review_received: 'review',
    review_approved: 'review',
    complaint_update: 'complaint',
    complaint_resolved: 'complaint',
    transport_arranged: 'transport',
    transport_completed: 'transport',
    settlement_processed: 'settlement',
    lodge_approved: 'lodge',
    lodge_rejected: 'lodge',
    price_change: 'lodge',
    availability_update: 'lodge',
    system_announcement: 'system',
    promotional: 'marketing',
    security_alert: 'security',
  };

  return this.create({
    user,
    type,
    category: categoryMap[type] || 'system',
    title,
    message,
    relatedEntity,
    actionUrl,
    actionText,
    priority,
    delivery: {
      inApp: true,
      push: false,
      email: false,
      sms: false,
      whatsapp: false,
      ...delivery,
    },
    metadata,
    expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulk = async function (notifications) {
  return this.insertMany(notifications, { ordered: false });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function (userId, notificationIds) {
  return this.updateMany(
    { user: userId, _id: { $in: notificationIds } },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to get user notifications
notificationSchema.statics.getForUser = function (userId, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false, type } = options;
  const query = { user: userId };
  if (unreadOnly) query.isRead = false;
  if (type) query.type = type;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return { deleted: result.deletedCount };
};

module.exports = mongoose.model('Notification', notificationSchema);