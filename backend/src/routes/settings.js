/**
 * Settings Routes
 * Platform settings management
 */

const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadUpiQrCode, handleUploadError } = require('../middleware/upload');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/settings
 * @desc Get all platform settings
 * @access Private (Super Admin)
 */
router.get('/', catchAsync(settingsController.getSettings));

/**
 * @route GET /api/settings/:section
 * @desc Get specific settings section
 * @access Private (Super Admin)
 */
router.get('/:section', catchAsync(settingsController.getSettingsSection));

/**
 * @route PUT /api/settings
 * @desc Update platform settings
 * @access Private (Super Admin)
 */
router.put('/', catchAsync(settingsController.updateSettings));

/**
 * @route PUT /api/settings/:section
 * @desc Update specific settings section
 * @access Private (Super Admin)
 */
router.put('/:section', catchAsync(settingsController.updateSettingsSection));

/**
 * @route POST /api/settings/upi-qr
 * @desc Upload UPI QR code
 * @access Private (Super Admin)
 */
router.post('/upi-qr', uploadUpiQrCode, handleUploadError, catchAsync(settingsController.uploadUpiQrCode));

module.exports = router;