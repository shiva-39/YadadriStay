/**
 * Admin Routes
 * Super admin dashboard and management
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadUpiQrCode, handleUploadError } = require('../middleware/upload');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard statistics
 * @access Private (Super Admin)
 */
router.get('/dashboard', catchAsync(adminController.getDashboard));

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Private (Super Admin)
 */
router.get('/users', catchAsync(adminController.getUsers));

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID
 * @access Private (Super Admin)
 */
router.get('/users/:id', catchAsync(adminController.getUserById));

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user
 * @access Private (Super Admin)
 */
router.put('/users/:id', catchAsync(adminController.updateUser));

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete/deactivate user
 * @access Private (Super Admin)
 */
router.delete('/users/:id', catchAsync(adminController.deleteUser));

/**
 * @route GET /api/admin/lodges
 * @desc Get all lodges
 * @access Private (Super Admin)
 */
router.get('/lodges', catchAsync(adminController.getLodges));

/**
 * @route GET /api/admin/lodges/:id
 * @desc Get lodge by ID
 * @access Private (Super Admin)
 */
router.get('/lodges/:id', catchAsync(adminController.getLodgeById));

/**
 * @route PUT /api/admin/lodges/:id/approve
 * @desc Approve lodge
 * @access Private (Super Admin)
 */
router.put('/lodges/:id/approve', catchAsync(adminController.approveLodge));

/**
 * @route PUT /api/admin/lodges/:id/reject
 * @desc Reject lodge
 * @access Private (Super Admin)
 */
router.put('/lodges/:id/reject', catchAsync(adminController.rejectLodge));

/**
 * @route PUT /api/admin/lodges/:id/status
 * @desc Update lodge status
 * @access Private (Super Admin)
 */
router.put('/lodges/:id/status', catchAsync(adminController.updateLodgeStatus));

/**
 * @route GET /api/admin/bookings
 * @desc Get all bookings
 * @access Private (Super Admin)
 */
router.get('/bookings', catchAsync(adminController.getBookings));

/**
 * @route GET /api/admin/payments/pending
 * @desc Get pending payments
 * @access Private (Super Admin)
 */
router.get('/payments/pending', catchAsync(adminController.getPendingPayments));

/**
 * @route PUT /api/admin/payments/:id/verify
 * @desc Verify/reject payment
 * @access Private (Super Admin)
 */
router.put('/payments/:id/verify', catchAsync(adminController.verifyPayment));

/**
 * @route GET /api/admin/complaints
 * @desc Get all complaints
 * @access Private (Super Admin)
 */
router.get('/complaints', catchAsync(adminController.getComplaints));

/**
 * @route GET /api/admin/transport
 * @desc Get all transport requests
 * @access Private (Super Admin)
 */
router.get('/transport', catchAsync(adminController.getTransportRequests));

/**
 * @route GET /api/admin/reviews/pending
 * @desc Get pending reviews
 * @access Private (Super Admin)
 */
router.get('/reviews/pending', catchAsync(adminController.getPendingReviews));

/**
 * @route PUT /api/admin/reviews/:id/approve
 * @desc Approve review
 * @access Private (Super Admin)
 */
router.put('/reviews/:id/approve', catchAsync(adminController.approveReview));

/**
 * @route PUT /api/admin/reviews/:id/reject
 * @desc Reject review
 * @access Private (Super Admin)
 */
router.put('/reviews/:id/reject', catchAsync(adminController.rejectReview));

/**
 * @route GET /api/admin/settlements
 * @desc Get all settlements
 * @access Private (Super Admin)
 */
router.get('/settlements', catchAsync(adminController.getSettlements));

/**
 * @route PUT /api/admin/settlements/:id/complete
 * @desc Complete settlement
 * @access Private (Super Admin)
 */
router.put('/settlements/:id/complete', catchAsync(adminController.completeSettlement));

module.exports = router;