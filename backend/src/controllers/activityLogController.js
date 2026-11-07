/**
 * Activity Log Controller
 * Handles audit trail and activity logs
 */

const ActivityLog = require('../models/ActivityLog');
const { BadRequestError } = require('../utils/errors');

/**
 * Get activity logs
 */
const getActivityLogs = async (req, res) => {
  const {
    user,
    userRole,
    action,
    actionCategory,
    entityType,
    entityId,
    severity,
    status,
    correlationId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = req.query;

  const filters = {};
  if (user) filters.user = user;
  if (userRole) filters.userRole = userRole;
  if (action) filters.action = action;
  if (actionCategory) filters.actionCategory = actionCategory;
  if (entityType) filters.entityType = entityType;
  if (entityId) filters.entityId = entityId;
  if (severity) filters.severity = severity;
  if (status) filters.status = status;
  if (correlationId) filters.correlationId = correlationId;
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const logs = await ActivityLog.getLogs(filters, {
    limit: parseInt(limit),
    skip: (page - 1) * limit,
    sort: '-createdAt',
  });

  const total = await ActivityLog.countDocuments(filters);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * Get activity log statistics
 */
const getActivityStats = async (req, res) => {
  const { startDate, endDate } = req.query;

  const filters = {};
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const stats = await ActivityLog.getStatistics(filters);

  // Also get severity breakdown
  const severityStats = await ActivityLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get top actions
  const topActions = await ActivityLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: {
      byCategory: stats,
      bySeverity: severityStats,
      topActions,
    },
  });
};

/**
 * Get activity logs for specific user
 */
const getUserActivity = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50, startDate, endDate } = req.query;

  const filters = { user: userId };
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const logs = await ActivityLog.getLogs(filters, {
    limit: parseInt(limit),
    skip: (page - 1) * limit,
    sort: '-createdAt',
  });

  const total = await ActivityLog.countDocuments(filters);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * Get activity logs for specific entity
 */
const getEntityActivity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const validEntityTypes = [
    'user', 'customer', 'lodge_owner', 'lodge', 'room_category',
    'room_inventory', 'booking', 'offline_booking', 'payment',
    'settlement', 'review', 'complaint', 'transport_request',
    'notification', 'admin_settings',
  ];

  if (!validEntityTypes.includes(entityType)) {
    throw new BadRequestError('Invalid entity type');
  }

  const filters = { entityType, entityId };
  const logs = await ActivityLog.getLogs(filters, {
    limit: parseInt(limit),
    skip: (page - 1) * limit,
    sort: '-createdAt',
  });

  const total = await ActivityLog.countDocuments(filters);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

module.exports = {
  getActivityLogs,
  getActivityStats,
  getUserActivity,
  getEntityActivity,
};