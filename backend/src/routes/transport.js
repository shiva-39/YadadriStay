/**
 * Transport Request Routes
 * Customer transport assistance requests
 */

const express = require('express');
const router = express.Router();

const transportController = require('../controllers/transportController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireCustomer, requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');

/**
 * @route POST /api/transport
 * @desc Create transport request
 * @access Private (Customer)
 */
router.post('/', authenticate, requireCustomer, rules.createTransportRequest, handleValidation, catchAsync(transportController.createTransportRequest));

/**
 * @route GET /api/transport
 * @desc Get user's transport requests
 * @access Private (Customer)
 */
router.get('/', authenticate, requireCustomer, catchAsync(transportController.getMyRequests));

/**
 * @route GET /api/transport/:id
 * @desc Get transport request details
 * @access Private (Customer, Admin)
 */
router.get('/:id', authenticate, catchAsync(transportController.getRequestById));

/**
 * @route PUT /api/transport/:id/cancel
 * @desc Cancel transport request
 * @access Private (Customer)
 */
router.put('/:id/cancel', authenticate, requireCustomer, catchAsync(transportController.cancelRequest));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/transport/admin
 * @desc Get all transport requests (admin)
 * @access Private (Super Admin)
 */
router.get('/admin', catchAsync(transportController.getAllRequests));

/**
 * @route GET /api/transport/admin/pending
 * @desc Get pending transport requests (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/pending', catchAsync(transportController.getPendingRequests));

/**
 * @route GET /api/transport/admin/:id
 * @desc Get transport request by ID (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/:id', catchAsync(transportController.getRequestByIdAdmin));

/**
 * @route PUT /api/transport/admin/:id/assign
 * @desc Assign transport request to admin team member
 * @access Private (Super Admin)
 */
router.put('/admin/:id/assign', catchAsync(transportController.assignRequest));

/**
 * @route PUT /api/transport/admin/:id/arrange
 * @desc Mark transport as arranged
 * @access Private (Super Admin)
 */
router.put('/admin/:id/arrange', catchAsync(transportController.arrangeTransport));

/**
 * @route PUT /api/transport/admin/:id/complete
 * @desc Complete transport request
 * @access Private (Super Admin)
 */
router.put('/admin/:id/complete', catchAsync(transportController.completeRequest));

/**
 * @route POST /api/transport/admin/:id/communicate
 * @desc Add communication log
 * @access Private (Super Admin)
 */
router.post('/admin/:id/communicate', catchAsync(transportController.addCommunication));

module.exports = router;