/**
 * Lodge Routes
 * Lodge management, search, and public listing
 */

const express = require('express');
const router = express.Router();

const lodgeController = require('../controllers/lodgeController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireLodgeOwner, requireSuperAdmin, requireLodgeOwnership } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadLodgeImages, uploadLodgeDocuments, handleUploadError } = require('../middleware/upload');

/**
 * @route GET /api/lodges
 * @desc Search lodges (public)
 * @access Public
 */
router.get('/', rules.lodgeSearch, handleValidation, catchAsync(lodgeController.searchLodges));

/**
 * @route GET /api/lodges/featured
 * @desc Get featured lodges
 * @access Public
 */
router.get('/featured', catchAsync(lodgeController.getFeaturedLodges));

/**
 * @route GET /api/lodges/nearby
 * @desc Get nearby lodges based on coordinates
 * @access Public
 */
router.get('/nearby', catchAsync(lodgeController.getNearbyLodges));

/**
 * @route GET /api/lodges/:id
 * @desc Get lodge details (public)
 * @access Public
 */
router.get('/:id', catchAsync(lodgeController.getLodgeById));

/**
 * @route GET /api/lodges/:id/availability
 * @desc Check lodge availability for dates
 * @access Public
 */
router.get('/:id/availability', catchAsync(lodgeController.checkAvailability));

// Protected routes - require authentication
router.use(authenticate);

// Lodge Owner routes
router.use('/owner', requireLodgeOwner);

/**
 * @route POST /api/lodges/owner
 * @desc Create new lodge
 * @access Private (Lodge Owner)
 */
router.post('/owner', uploadLodgeImages, handleUploadError, rules.createLodge, handleValidation, catchAsync(lodgeController.createLodge));

/**
 * @route GET /api/lodges/owner
 * @desc Get owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/owner', catchAsync(lodgeController.getOwnerLodges));

/**
 * @route GET /api/lodges/owner/:id
 * @desc Get owner's lodge by ID
 * @access Private (Lodge Owner)
 */
router.get('/owner/:id', requireLodgeOwnership, catchAsync(lodgeController.getOwnerLodgeById));

/**
 * @route PUT /api/lodges/owner/:id
 * @desc Update owner's lodge
 * @access Private (Lodge Owner)
 */
router.put('/owner/:id', requireLodgeOwnership, uploadLodgeImages, handleUploadError, rules.updateLodge, handleValidation, catchAsync(lodgeController.updateLodge));

/**
 * @route DELETE /api/lodges/owner/:id
 * @desc Delete/deactivate owner's lodge
 * @access Private (Lodge Owner)
 */
router.delete('/owner/:id', requireLodgeOwnership, catchAsync(lodgeController.deleteLodge));

/**
 * @route POST /api/lodges/owner/:id/documents
 * @desc Upload lodge documents
 * @access Private (Lodge Owner)
 */
router.post('/owner/:id/documents', requireLodgeOwnership, uploadLodgeDocuments, handleUploadError, catchAsync(lodgeController.uploadDocuments));

/**
 * @route POST /api/lodges/owner/:id/submit-approval
 * @desc Submit lodge for approval
 * @access Private (Lodge Owner)
 */
router.post('/owner/:id/submit-approval', requireLodgeOwnership, catchAsync(lodgeController.submitForApproval));

// Super Admin routes
router.use('/admin', requireSuperAdmin);

/**
 * @route GET /api/lodges/admin
 * @desc Get all lodges (admin)
 * @access Private (Super Admin)
 */
router.get('/admin', catchAsync(lodgeController.getAllLodges));

/**
 * @route GET /api/lodges/admin/:id
 * @desc Get lodge by ID (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/:id', catchAsync(lodgeController.getLodgeByIdAdmin));

/**
 * @route PUT /api/lodges/admin/:id/approve
 * @desc Approve lodge
 * @access Private (Super Admin)
 */
router.put('/admin/:id/approve', catchAsync(lodgeController.approveLodge));

/**
 * @route PUT /api/lodges/admin/:id/reject
 * @desc Reject lodge
 * @access Private (Super Admin)
 */
router.put('/admin/:id/reject', catchAsync(lodgeController.rejectLodge));

/**
 * @route PUT /api/lodges/admin/:id/status
 * @desc Update lodge status
 * @access Private (Super Admin)
 */
router.put('/admin/:id/status', catchAsync(lodgeController.updateLodgeStatus));

/**
 * @route DELETE /api/lodges/admin/:id
 * @desc Delete lodge (admin)
 * @access Private (Super Admin)
 */
router.delete('/admin/:id', catchAsync(lodgeController.deleteLodgeAdmin));

module.exports = router;