/**
 * Notification Controller
 * Handles in-app notifications
 */

const Notification = require('../models/Notification');
const { NotFoundError } = require('../utils/errors');

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  const { limit = 20, skip = 0, unreadOnly = false, type } = req.query;

  const notifications = await Notification.getForUser(req.user._id, {
    limit: parseInt(limit),
    skip: parseInt(skip),
    unreadOnly: unreadOnly === 'true',
    type,
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
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  const count = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: { count },
  });
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
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
const markAllAsRead = async (req, res) => {
  await Notification.markAllAsRead(req.user._id);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  res.json({
    success: true,
    message: 'Notification deleted',
  });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};