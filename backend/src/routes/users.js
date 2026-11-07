/**
 * User Routes
 * User management, profiles, and customer/lodge owner specific endpoints
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireCustomer, requireLodgeOwner, requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadProfileImage, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/users/dashboard
 * @desc Get user dashboard data based on role
 * @access Private
 */
router.get('/dashboard', catchAsync(userController.getDashboard));

/**
 * @route GET /api/users/profile
 * @desc Get detailed user profile
 * @access Private
 */
router.get('/profile', catchAsync(userController.getProfile));

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', rules.updateProfile, handleValidation, catchAsync(userController.updateProfile));

/**
 * @route PUT /api/users/profile/image
 * @desc Upload profile image
 * @access Private
 */
router.put('/profile/image', uploadProfileImage, handleUploadError, catchAsync(userController.uploadProfileImage));

/**
 * @route GET /api/users/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/notifications', catchAsync(userController.getNotifications));

/**
 * @route PUT /api/users/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/notifications/:id/read', catchAsync(userController.markNotificationRead));

/**
 * @route PUT /api/users/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/notifications/read-all', catchAsync(userController.markAllNotificationsRead));

// Customer-only routes
router.use('/customer', requireCustomer);

/**
 * @route GET /api/users/customer/bookings
 * @desc Get customer bookings
 * @access Private (Customer)
 */
router.get('/customer/bookings', catchAsync(userController.getCustomerBookings));

/**
 * @route GET /api/users/customer/bookings/:id
 * @desc Get booking details
 * @access Private (Customer)
 */
router.get('/customer/bookings/:id', catchAsync(userController.getBookingDetails));

/**
 * @route GET /api/users/customer/reviews
 * @desc Get customer reviews
 * @access Private (Customer)
 */
router.get('/customer/reviews', catchAsync(userController.getCustomerReviews));

/**
 * @route GET /api/users/customer/complaints
 * @desc Get customer complaints
 * @access Private (Customer)
 */
router.get('/customer/complaints', catchAsync(userController.getCustomerComplaints));

/**
 * @route GET /api/users/customer/transport-requests
 * @desc Get customer transport requests
 * @access Private (Customer)
 */
router.get('/customer/transport-requests', catchAsync(userController.getCustomerTransportRequests));

// Lodge Owner-only routes
router.use('/owner', requireLodgeOwner);

/**
 * @route GET /api/users/owner/lodges
 * @desc Get owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/owner/lodges', catchAsync(userController.getOwnerLodges));

/**
 * @route GET /api/users/owner/stats
 * @desc Get owner dashboard statistics
 * @access Private (Lodge Owner)
 */
router.get('/owner/stats', catchAsync(userController.getOwnerStats));

/**
 * @route GET /api/users/owner/bookings
 * @desc Get bookings for owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/owner/bookings', catchAsync(userController.getOwnerBookings));

/**
 * @route GET /api/users/owner/offline-bookings
 * @desc Get offline bookings for owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/owner/offline-bookings', catchAsync(userController.getOwnerOfflineBookings));

/**
 * @route GET /api/users/owner/payments
 * @desc Get payments for owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/owner/payments', catchAsync(userController.getOwnerPayments));

/**
 * @route GET /api/users/owner/settlements
 * @desc Get settlements for owner
 * @access Private (Lodge Owner)
 */
router.get('/owner/settlements', catchAsync(userController.getOwnerSettlements));

// Super Admin-only routes
router.use('/admin', requireSuperAdmin);

/**
 * @route GET /api/users/admin/users
 * @desc Get all users (paginated)
 * @access Private (Super Admin)
 */
router.get('/admin/users', catchAsync(userController.getAllUsers));

/**
 * @route GET /api/users/admin/users/:id
 * @desc Get user by ID
 * @access Private (Super Admin)
 */
router.get('/admin/users/:id', catchAsync(userController.getUserById));

/**
 * @route PUT /api/users/admin/users/:id
 * @desc Update user (admin)
 * @access Private (Super Admin)
 */
router.put('/admin/users/:id', catchAsync(userController.updateUserByAdmin));

/**
 * @route DELETE /api/users/admin/users/:id
 * @desc Delete/deactivate user
 * @access Private (Super Admin)
 */
router.delete('/admin/users/:id', catchAsync(userController.deleteUser));

module.exports = router;