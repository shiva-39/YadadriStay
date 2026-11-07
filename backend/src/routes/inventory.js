/**
 * Inventory Routes
 * Date-wise room inventory management
 */

const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireLodgeOwner, requireRoomCategoryOwnership } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');

/**
 * @route GET /api/inventory/lodge/:lodgeId
 * @desc Get inventory for lodge (owner)
 * @access Private (Lodge Owner)
 */
router.get('/lodge/:lodgeId', authenticate, requireLodgeOwner, catchAsync(inventoryController.getLodgeInventory));

/**
 * @route GET /api/inventory/category/:categoryId
 * @desc Get inventory for room category (owner)
 * @access Private (Lodge Owner)
 */
router.get('/category/:categoryId', authenticate, requireRoomCategoryOwnership, catchAsync(inventoryController.getCategoryInventory));

/**
 * @route PUT /api/inventory/category/:categoryId
 * @desc Bulk update inventory for room category (owner)
 * @access Private (Lodge Owner)
 */
router.put('/category/:categoryId', authenticate, requireRoomCategoryOwnership, rules.updateInventory, handleValidation, catchAsync(inventoryController.bulkUpdateInventory));

/**
 * @route POST /api/inventory/category/:categoryId/extend
 * @desc Extend inventory for future dates (owner)
 * @access Private (Lodge Owner)
 */
router.post('/category/:categoryId/extend', authenticate, requireRoomCategoryOwnership, catchAsync(inventoryController.extendInventory));

/**
 * @route GET /api/inventory/availability
 * @desc Check availability for booking (public/internal)
 * @access Private
 */
router.get('/availability', authenticate, catchAsync(inventoryController.checkAvailability));

module.exports = router;