/**
 * Complaint Routes
 * Customer complaints and support tickets
 */

const express = require('express');
const router = express.Router();

const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireCustomer, requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadComplaintAttachments, handleUploadError } = require('../middleware/upload');

/**
 * @route POST /api/complaints
 * @desc Create complaint
 * @access Private (Customer)
 */
router.post('/', authenticate, requireCustomer, uploadComplaintAttachments, handleUploadError, rules.createComplaint, handleValidation, catchAsync(complaintController.createComplaint));

/**
 * @route GET /api/complaints
 * @desc Get user's complaints
 * @access Private (Customer)
 */
router.get('/', authenticate, requireCustomer, catchAsync(complaintController.getMyComplaints));

/**
 * @route GET /api/complaints/:id
 * @desc Get complaint details
 * @access Private (Customer, Admin)
 */
router.get('/:id', authenticate, catchAsync(complaintController.getComplaintById));

/**
 * @route POST /api/complaints/:id/messages
 * @desc Add message to complaint
 * @access Private (Customer, Admin)
 */
router.post('/:id/messages', authenticate, catchAsync(complaintController.addMessage));

/**
 * @route PUT /api/complaints/:id/satisfaction
 * @desc Submit satisfaction rating
 * @access Private (Customer)
 */
router.put('/:id/satisfaction', authenticate, requireCustomer, catchAsync(complaintController.submitSatisfaction));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/complaints/admin
 * @desc Get all complaints (admin)
 * @access Private (Super Admin)
 */
router.get('/admin', catchAsync(complaintController.getAllComplaints));

/**
 * @route GET /api/complaints/admin/open
 * @desc Get open complaints (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/open', catchAsync(complaintController.getOpenComplaints));

/**
 * @route GET /api/complaints/admin/:id
 * @desc Get complaint by ID (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/:id', catchAsync(complaintController.getComplaintByIdAdmin));

/**
 * @route PUT /api/complaints/admin/:id/assign
 * @desc Assign complaint to admin
 * @access Private (Super Admin)
 */
router.put('/admin/:id/assign', catchAsync(complaintController.assignComplaint));

/**
 * @route PUT /api/complaints/admin/:id/resolve
 * @desc Resolve complaint
 * @access Private (Super Admin)
 */
router.put('/admin/:id/resolve', catchAsync(complaintController.resolveComplaint));

/**
 * @route PUT /api/complaints/admin/:id/close
 * @desc Close complaint
 * @access Private (Super Admin)
 */
router.put('/admin/:id/close', catchAsync(complaintController.closeComplaint));

/**
 * @route PUT /api/complaints/admin/:id/reopen
 * @desc Reopen complaint
 * @access Private (Super Admin)
 */
router.put('/admin/:id/reopen', catchAsync(complaintController.reopenComplaint));

/**
 * @route GET /api/complaints/admin/stats
 * @desc Get complaint statistics
 * @access Private (Super Admin)
 */
router.get('/admin/stats', catchAsync(complaintController.getComplaintStats));

module.exports = router;