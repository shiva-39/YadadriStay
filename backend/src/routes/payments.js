/**
 * Payment Routes
 * Payment submission and verification
 */

const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireCustomer, requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadPaymentScreenshot, handleUploadError } = require('../middleware/upload');

/**
 * @route POST /api/payments
 * @desc Submit payment evidence
 * @access Private (Customer)
 */
router.post('/', authenticate, requireCustomer, uploadPaymentScreenshot, handleUploadError, rules.submitPayment, handleValidation, catchAsync(paymentController.submitPayment));

/**
 * @route GET /api/payments
 * @desc Get user's payments
 * @access Private (Customer)
 */
router.get('/', authenticate, requireCustomer, catchAsync(paymentController.getMyPayments));

/**
 * @route GET /api/payments/:id
 * @desc Get payment details
 * @access Private (Customer, Lodge Owner, Admin)
 */
router.get('/:id', authenticate, catchAsync(paymentController.getPaymentById));

/**
 * @route GET /api/payments/booking/:bookingId
 * @desc Get payment for booking
 * @access Private (Customer, Lodge Owner, Admin)
 */
router.get('/booking/:bookingId', authenticate, catchAsync(paymentController.getPaymentByBooking));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/payments/admin/pending
 * @desc Get pending payment verifications
 * @access Private (Super Admin)
 */
router.get('/admin/pending', catchAsync(paymentController.getPendingVerifications));

/**
 * @route PUT /api/payments/admin/:id/verify
 * @desc Verify or reject payment
 * @access Private (Super Admin)
 */
router.put('/admin/:id/verify', rules.verifyPayment, handleValidation, catchAsync(paymentController.verifyPayment));

/**
 * @route GET /api/payments/admin/stats
 * @desc Get payment statistics
 * @access Private (Super Admin)
 */
router.get('/admin/stats', catchAsync(paymentController.getPaymentStats));

module.exports = router;