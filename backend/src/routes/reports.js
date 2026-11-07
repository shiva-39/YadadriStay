/**
 * Reports Routes
 * Booking, revenue, and platform analytics reports
 */

const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin, requireLodgeOwner } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @route GET /api/reports/owner/bookings
 * @desc Get booking reports for owner
 * @access Private (Lodge Owner)
 */
router.get('/owner/bookings', authenticate, requireLodgeOwner, catchAsync(reportController.getOwnerBookingReport));

/**
 * @route GET /api/reports/owner/revenue
 * @desc Get revenue reports for owner
 * @access Private (Lodge Owner)
 */
router.get('/owner/revenue', authenticate, requireLodgeOwner, catchAsync(reportController.getOwnerRevenueReport));

/**
 * @route GET /api/reports/owner/occupancy
 * @desc Get occupancy reports for owner
 * @access Private (Lodge Owner)
 */
router.get('/owner/occupancy', authenticate, requireLodgeOwner, catchAsync(reportController.getOwnerOccupancyReport));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/reports/admin/bookings
 * @desc Get platform booking reports
 * @access Private (Super Admin)
 */
router.get('/admin/bookings', catchAsync(reportController.getPlatformBookingReport));

/**
 * @route GET /api/reports/admin/revenue
 * @desc Get platform revenue reports
 * @access Private (Super Admin)
 */
router.get('/admin/revenue', catchAsync(reportController.getPlatformRevenueReport));

/**
 * @route GET /api/reports/admin/lodges
 * @desc Get lodge-wise reports
 * @access Private (Super Admin)
 */
router.get('/admin/lodges', catchAsync(reportController.getLodgeWiseReport));

/**
 * @route GET /api/reports/admin/payments
 * @desc Get payment verification reports
 * @access Private (Super Admin)
 */
router.get('/admin/payments', catchAsync(reportController.getPaymentReport));

/**
 * @route GET /api/reports/admin/advance
 * @desc Get advance collection reports
 * @access Private (Super Admin)
 */
router.get('/admin/advance', catchAsync(reportController.getAdvanceCollectionReport));

/**
 * @route GET /api/reports/admin/refunds
 * @desc Get refund reports
 * @access Private (Super Admin)
 */
router.get('/admin/refunds', catchAsync(reportController.getRefundReport));

/**
 * @route GET /api/reports/admin/export
 * @desc Export report as CSV
 * @access Private (Super Admin)
 */
router.get('/admin/export', catchAsync(reportController.exportReport));

module.exports = router;