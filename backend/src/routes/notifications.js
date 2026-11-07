/**
 * Notification Routes
 * In-app notifications management
 */

const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', authenticate, catchAsync(notificationController.getNotifications));

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', authenticate, catchAsync(notificationController.getUnreadCount));

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', authenticate, catchAsync(notificationController.markAsRead));

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', authenticate, catchAsync(notificationController.markAllAsRead));

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', authenticate, catchAsync(notificationController.deleteNotification));

module.exports = router;