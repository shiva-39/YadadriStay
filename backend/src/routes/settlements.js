/**
 * Settlement Routes
 * Platform-to-lodge-owner settlement management
 */

const express = require('express');
const router = express.Router();

const settlementController = require('../controllers/settlementController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireLodgeOwner, requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');

/**
 * @route GET /api/settlements
 * @desc Get owner's settlements
 * @access Private (Lodge Owner)
 */
router.get('/', authenticate, requireLodgeOwner, catchAsync(settlementController.getMySettlements));

/**
 * @route GET /api/settlements/:id
 * @desc Get settlement details
 * @access Private (Lodge Owner, Admin)
 */
router.get('/:id', authenticate, catchAsync(settlementController.getSettlementById));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/settlements/admin
 * @desc Get all settlements (admin)
 * @access Private (Super Admin)
 */
router.get('/admin', catchAsync(settlementController.getAllSettlements));

/**
 * @route GET /api/settlements/admin/:id
 * @desc Get settlement by ID (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/:id', catchAsync(settlementController.getSettlementByIdAdmin));

/**
 * @route PUT /api/settlements/admin/:id/process
 * @desc Process settlement
 * @access Private (Super Admin)
 */
router.put('/admin/:id/process', catchAsync(settlementController.processSettlement));

/**
 * @route PUT /api/settlements/admin/:id/complete
 * @desc Complete settlement
 * @access Private (Super Admin)
 */
router.put('/admin/:id/complete', catchAsync(settlementController.completeSettlement));

/**
 * @route GET /api/settlements/admin/stats
 * @desc Get settlement statistics
 * @access Private (Super Admin)
 */
router.get('/admin/stats', catchAsync(settlementController.getSettlementStats));

module.exports = router;