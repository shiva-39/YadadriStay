/**
 * Settlement Controller
 * Handles platform-to-lodge-owner settlement management
 */

const Settlement = require('../models/Settlement');
const Payment = require('../models/Payment');
const Lodge = require('../models/Lodge');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

/**
 * Get owner's settlements
 */
const getMySettlements = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { lodgeOwner: req.user._id };
  if (status) query.status = status;

  const settlements = await Settlement.find(query)
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .populate('lodge', 'name')
    .populate('payment', 'paymentId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Settlement.countDocuments(query);

  // Get pending amount
  const pendingSettlements = await Settlement.find({ lodgeOwner: req.user._id, status: 'pending' });
  const pendingAmount = pendingSettlements.reduce((sum, s) => sum + s.settlementAmount, 0);

  res.json({
    success: true,
    data: {
      settlements,
      pendingAmount,
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
 * Get settlement by ID
 */
const getSettlementById = async (req, res) => {
  const { id } = req.params;

  const settlement = await Settlement.findById(id)
    .populate('booking', 'bookingId checkInDate checkOutDate pricing')
    .populate('lodge', 'name address contact')
    .populate('payment', 'paymentId upi')
    .populate('processedBy', 'fullName');

  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  // Check access
  const user = req.user;
  if (user.role === 'lodge_owner' && settlement.lodgeOwner.toString() !== user._id.toString()) {
    throw new ForbiddenError('Access denied');
  }

  res.json({
    success: true,
    data: { settlement },
  });
};

/**
 * Get all settlements (admin)
 */
const getAllSettlements = async (req, res) => {
  const { status, lodgeOwnerId, lodgeId, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (lodgeOwnerId) query.lodgeOwner = lodgeOwnerId;
  if (lodgeId) query.lodge = lodgeId;

  const settlements = await Settlement.find(query)
    .populate('lodgeOwner', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .populate('payment', 'paymentId')
    .populate('processedBy', 'fullName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Settlement.countDocuments(query);

  res.json({
    success: true,
    data: {
      settlements,
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
 * Get settlement by ID (admin)
 */
const getSettlementByIdAdmin = async (req, res) => {
  const { id } = req.params;

  const settlement = await Settlement.findById(id)
    .populate('lodgeOwner', 'fullName phone email bankDetails')
    .populate('lodge', 'name address contact')
    .populate('booking', 'bookingId checkInDate checkOutDate pricing')
    .populate('payment', 'paymentId upi')
    .populate('processedBy', 'fullName');

  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  res.json({
    success: true,
    data: { settlement },
  });
};

/**
 * Process settlement (mark as processing)
 */
const processSettlement = async (req, res) => {
  const { id } = req.params;

  const settlement = await Settlement.findById(id);
  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  if (settlement.status !== 'pending') {
    throw new BadRequestError('Settlement is not pending');
  }

  await settlement.markProcessing(req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'process_settlement',
    actionCategory: 'settlement',
    entityType: 'settlement',
    entityId: settlement._id,
    entityName: settlement.settlementId,
    description: `Marked settlement ${settlement.settlementId} as processing`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Settlement marked as processing',
    data: { settlement },
  });
};

/**
 * Complete settlement
 */
const completeSettlement = async (req, res) => {
  const { id } = req.params;
  const { transactionRef, paymentMethod = 'bank_transfer' } = req.body;

  if (!transactionRef) {
    throw new BadRequestError('Transaction reference is required');
  }

  const settlement = await Settlement.findById(id);
  if (!settlement) {
    throw new NotFoundError('Settlement not found');
  }

  if (!['pending', 'processing'].includes(settlement.status)) {
    throw new BadRequestError('Settlement cannot be completed in current state');
  }

  await settlement.complete(req.user._id, transactionRef, paymentMethod);

  // Notify lodge owner
  await Notification.createNotification({
    user: settlement.lodgeOwner,
    type: 'settlement_processed',
    title: 'Settlement Completed',
    message: `Settlement ${settlement.settlementId} of ₹${settlement.settlementAmount} has been processed.`,
    relatedEntity: { entityType: 'settlement', entityId: settlement._id },
    priority: 'high',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'complete_settlement',
    actionCategory: 'settlement',
    entityType: 'settlement',
    entityId: settlement._id,
    entityName: settlement.settlementId,
    description: `Completed settlement ${settlement.settlementId} with transaction ${transactionRef}`,
    metadata: { transactionRef, paymentMethod },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Settlement completed successfully',
    data: { settlement },
  });
};

/**
 * Get settlement statistics (admin)
 */
const getSettlementStats = async (req, res) => {
  const { startDate, endDate, lodgeOwnerId } = req.query;

  const filters = {};
  if (lodgeOwnerId) filters.lodgeOwner = lodgeOwnerId;
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const stats = await Settlement.getStatistics(filters);

  // Get pending settlements
  const pendingSettlements = await Settlement.find({ status: 'pending' })
    .populate('lodgeOwner', 'fullName')
    .populate('lodge', 'name');

  const totalPending = pendingSettlements.reduce((sum, s) => sum + s.settlementAmount, 0);

  res.json({
    success: true,
    data: {
      byStatus: stats,
      totalPendingAmount: totalPending,
      pendingCount: pendingSettlements.length,
      pendingSettlements: pendingSettlements.slice(0, 10),
    },
  });
};

module.exports = {
  getMySettlements,
  getSettlementById,
  getAllSettlements,
  getSettlementByIdAdmin,
  processSettlement,
  completeSettlement,
  getSettlementStats,
};