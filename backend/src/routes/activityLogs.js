/**
 * Activity Log Routes
 * Audit trail and activity logs
 */

const express = require('express');
const router = express.Router();

const activityLogController = require('../controllers/activityLogController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/activity-logs
 * @desc Get activity logs
 * @access Private (Super Admin)
 */
router.get('/', catchAsync(activityLogController.getActivityLogs));

/**
 * @route GET /api/activity-logs/stats
 * @desc Get activity log statistics
 * @access Private (Super Admin)
 */
router.get('/stats', catchAsync(activityLogController.getActivityStats));

/**
 * @route GET /api/activity-logs/user/:userId
 * @desc Get activity logs for specific user
 * @access Private (Super Admin)
 */
router.get('/user/:userId', catchAsync(activityLogController.getUserActivity));

/**
 * @route GET /api/activity-logs/entity/:entityType/:entityId
 * @desc Get activity logs for specific entity
 * @access Private (Super Admin)
 */
router.get('/entity/:entityType/:entityId', catchAsync(activityLogController.getEntityActivity));

module.exports = router;