/**
 * Room Category Routes
 * Room category management for lodges
 */

const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireLodgeOwner, requireRoomCategoryOwnership } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadRoomImages, handleUploadError } = require('../middleware/upload');

/**
 * @route GET /api/rooms/lodge/:lodgeId
 * @desc Get room categories for a lodge (public)
 * @access Public
 */
router.get('/lodge/:lodgeId', catchAsync(roomController.getRoomCategoriesForLodge));

/**
 * @route GET /api/rooms/:id
 * @desc Get room category details (public)
 * @access Public
 */
router.get('/:id', catchAsync(roomController.getRoomCategoryById));

/**
 * @route GET /api/rooms/:id/availability
 * @desc Check room category availability for dates
 * @access Public
 */
router.get('/:id/availability', catchAsync(roomController.checkAvailability));

// Protected routes
router.use(authenticate);

// Lodge Owner routes
router.use('/owner', requireLodgeOwner);

/**
 * @route POST /api/rooms/owner
 * @desc Create room category
 * @access Private (Lodge Owner)
 */
router.post('/owner', uploadRoomImages, handleUploadError, rules.createRoomCategory, handleValidation, catchAsync(roomController.createRoomCategory));

/**
 * @route GET /api/rooms/owner
 * @desc Get owner's room categories
 * @access Private (Lodge Owner)
 */
router.get('/owner', catchAsync(roomController.getOwnerRoomCategories));

/**
 * @route GET /api/rooms/owner/:id
 * @desc Get owner's room category by ID
 * @access Private (Lodge Owner)
 */
router.get('/owner/:id', requireRoomCategoryOwnership, catchAsync(roomController.getOwnerRoomCategoryById));

/**
 * @route PUT /api/rooms/owner/:id
 * @desc Update room category
 * @access Private (Lodge Owner)
 */
router.put('/owner/:id', requireRoomCategoryOwnership, uploadRoomImages, handleUploadError, rules.updateRoomCategory, handleValidation, catchAsync(roomController.updateRoomCategory));

/**
 * @route DELETE /api/rooms/owner/:id
 * @desc Delete room category
 * @access Private (Lodge Owner)
 */
router.delete('/owner/:id', requireRoomCategoryOwnership, catchAsync(roomController.deleteRoomCategory));

/**
 * @route PUT /api/rooms/owner/:id/availability
 * @desc Bulk update room availability
 * @access Private (Lodge Owner)
 */
router.put('/owner/:id/availability', requireRoomCategoryOwnership, catchAsync(roomController.updateAvailability));

/**
 * @route PUT /api/rooms/owner/:id/pricing
 * @desc Update room pricing
 * @access Private (Lodge Owner)
 */
router.put('/owner/:id/pricing', requireRoomCategoryOwnership, catchAsync(roomController.updatePricing));

module.exports = router;