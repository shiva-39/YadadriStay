/**
 * Payment Controller
 * Handles payment submission, verification, and management
 */

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const RoomInventory = require('../models/RoomInventory');
const Settlement = require('../models/Settlement');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { uploadPaymentScreenshot: uploadPaymentScreenshotUtil } = require('../utils/cloudinary');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Submit payment evidence
 */
const submitPayment = async (req, res) => {
  const customer = req.user;
  const { bookingId, upi } = req.body;

  if (!req.file) {
    throw new BadRequestError('Payment screenshot is required');
  }

  // Verify booking ownership
  const booking = await Booking.findOne({ _id: bookingId, customer: customer._id });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check if payment already exists
  if (booking.payment) {
    const existingPayment = await Payment.findById(booking.payment);
    if (existingPayment && existingPayment.status !== 'rejected') {
      throw new ConflictError('Payment already submitted for this booking');
    }
  }

  // Check if booking is still valid
  if (booking.status !== 'pending_payment') {
    throw new BadRequestError('Booking is no longer pending payment');
  }

  // Check for duplicate transaction reference
  const isDuplicate = await Payment.isDuplicateTransactionRef(upi.transactionRef);
  if (isDuplicate) {
    throw new ConflictError('Transaction reference already used');
  }

  // Upload screenshot to Cloudinary
  const screenshotResult = await uploadPaymentScreenshotUtil(req.file.buffer, bookingId);

  // Create payment record
  const payment = await Payment.create({
    booking: bookingId,
    customer: customer._id,
    lodge: booking.lodge,
    amount: booking.pricing.advanceAmount,
    upi: {
      vpa: upi.vpa || (await require('../models/AdminSettings').getSection('upi')).vpa,
      transactionRef: upi.transactionRef,
      transactionDate: upi.transactionDate ? new Date(upi.transactionDate) : new Date(),
      payerName: upi.payerName,
      payerVPA: upi.payerVPA,
      bankReference: upi.bankReference,
    },
    screenshot: {
      url: screenshotResult.secure_url,
      publicId: screenshotResult.public_id,
      uploadedAt: new Date(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    },
    status: 'payment_submitted',
  });

  // Update booking status
  booking.status = 'pending_verification';
  booking.payment = payment._id;
  await booking.save();

  // Submit evidence (sets status to pending_verification and sets expiry)
  await payment.submitEvidence(
    screenshotResult.secure_url,
    screenshotResult.public_id,
    upi.transactionRef,
    {
      transactionDate: upi.transactionDate ? new Date(upi.transactionDate) : new Date(),
      payerName: upi.payerName,
      payerVPA: upi.payerVPA,
      bankReference: upi.bankReference,
    }
  );

  // Notify admins
  const admins = await require('../models/User').find({ role: 'super_admin', isActive: true });
  for (const admin of admins) {
    await Notification.createNotification({
      user: admin._id,
      type: 'payment_pending',
      title: 'New Payment Submitted',
      message: `Payment ${payment.paymentId} for booking ${booking.bookingId} requires verification.`,
      relatedEntity: { entityType: 'payment', entityId: payment._id },
      actionUrl: `/admin/payments/${payment._id}`,
      actionText: 'Verify',
      priority: 'high',
    });
  }

  // Notify lodge owner
  const lodge = await require('../models/Lodge').findById(booking.lodge);
  if (lodge) {
    await Notification.createNotification({
      user: lodge.owner,
      type: 'payment_received',
      title: 'Payment Submitted',
      message: `Customer submitted payment for booking ${booking.bookingId}. Awaiting verification.`,
      relatedEntity: { entityType: 'payment', entityId: payment._id },
      priority: 'normal',
    });
  }

  // Log activity
  await ActivityLog.logPayment(customer, payment, 'submit', { ip: req.ip });

  res.status(201).json({
    success: true,
    message: 'Payment submitted successfully. Awaiting admin verification.',
    data: { payment },
  });
};

/**
 * Get user's payments
 */
const getMyPayments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { customer: req.user._id };
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate('booking', 'bookingId checkInDate checkOutDate status')
    .populate('lodge', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    data: {
      payments,
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
 * Get payment by ID
 */
const getPaymentById = async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate('booking', 'bookingId checkInDate checkOutDate status customer lodge roomCategory')
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name contact')
    .populate('verification.verifiedBy', 'fullName');

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Check access
  const user = req.user;
  if (user.role === 'customer' && payment.customer._id.toString() !== user._id.toString()) {
    throw new ForbiddenError('Access denied');
  }
  if (user.role === 'lodge_owner') {
    const lodge = await require('../models/Lodge').findById(payment.lodge._id);
    if (lodge.owner.toString() !== user._id.toString()) {
      throw new ForbiddenError('Access denied');
    }
  }

  res.json({
    success: true,
    data: { payment },
  });
};

/**
 * Get payment by booking ID
 */
const getPaymentByBooking = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check access
  const user = req.user;
  if (user.role === 'customer' && booking.customer.toString() !== user._id.toString()) {
    throw new ForbiddenError('Access denied');
  }
  if (user.role === 'lodge_owner') {
    const lodge = await require('../models.Lodge').findById(booking.lodge);
    if (lodge.owner.toString() !== user._id.toString()) {
      throw new ForbiddenError('Access denied');
    }
  }

  if (!booking.payment) {
    throw new NotFoundError('No payment found for this booking');
  }

  const payment = await Payment.findById(booking.payment)
    .populate('booking', 'bookingId checkInDate checkOutDate status')
    .populate('lodge', 'name')
    .populate('verification.verifiedBy', 'fullName');

  res.json({
    success: true,
    data: { payment },
  });
};

/**
 * Get pending payment verifications (admin)
 */
const getPendingVerifications = async (req, res) => {
  const { page = 1, limit = 20, lodgeId, startDate, endDate } = req.query;

  const filters = {};
  if (lodgeId) filters.lodge = lodgeId;
  if (startDate || endDate) {
    filters.submittedAt = {};
    if (startDate) filters.submittedAt.$gte = new Date(startDate);
    if (endDate) filters.submittedAt.$lte = new Date(endDate);
  }

  const payments = await Payment.getPendingVerifications(filters);

  // Manual pagination since getPendingVerifications returns array
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = payments.slice(start, end);

  res.json({
    success: true,
    data: {
      payments: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length,
        pages: Math.ceil(payments.length / limit),
      },
    },
  });
};

/**
 * Verify or reject payment (admin)
 */
const verifyPayment = async (req, res) => {
  const { id } = req.params;
  const { action, notes, rejectionReason } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (!payment.canBeVerified) {
    throw new BadRequestError('Payment cannot be verified in current state');
  }

  let updatedPayment;
  if (action === 'approve') {
    updatedPayment = await payment.verify(req.user._id, notes || '');
  } else if (action === 'reject') {
    if (!rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }
    updatedPayment = await payment.reject(req.user._id, rejectionReason);
  } else {
    throw new BadRequestError('Invalid action. Must be approve or reject');
  }

  // Notify customer
  await Notification.createNotification({
    user: payment.customer,
    type: action === 'approve' ? 'payment_verified' : 'payment_rejected',
    title: action === 'approve' ? 'Payment Verified' : 'Payment Rejected',
    message: action === 'approve'
      ? `Your payment for booking ${payment.booking.bookingId} has been verified. Your booking is now confirmed!`
      : `Your payment for booking ${payment.booking.bookingId} was rejected. Reason: ${rejectionReason}`,
    relatedEntity: { entityType: 'payment', entityId: payment._id },
    priority: 'high',
  });

  // Notify lodge owner
  const lodge = await require('../models/Lodge').findById(payment.lodge);
  if (lodge) {
    await Notification.createNotification({
      user: lodge.owner,
      type: action === 'approve' ? 'payment_verified' : 'payment_rejected',
      title: action === 'approve' ? 'Payment Verified' : 'Payment Rejected',
      message: `Payment for booking ${payment.booking.bookingId} has been ${action === 'approve' ? 'verified' : 'rejected'}.`,
      relatedEntity: { entityType: 'payment', entityId: payment._id },
      priority: 'normal',
    });
  }

  // Log activity
  await ActivityLog.logPayment(req.user, updatedPayment, action === 'approve' ? 'verify' : 'reject', {
    notes,
    rejectionReason,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully`,
    data: { payment: updatedPayment },
  });
};

/**
 * Get payment statistics (admin)
 */
const getPaymentStats = async (req, res) => {
  const { startDate, endDate, lodgeId } = req.query;

  const filters = {};
  if (lodgeId) filters.lodge = lodgeId;
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const stats = await Payment.getStatistics(filters);

  // Also get totals
  const totals = await Payment.aggregate([
    { $match: { status: { $in: ['verified', 'refunded'] } } },
    {
      $group: {
        _id: null,
        totalVerified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$amount', 0] } },
        totalRefunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
        verifiedCount: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
        refundedCount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      byStatus: stats,
      totals: totals[0] || {
        totalVerified: 0,
        totalRefunded: 0,
        verifiedCount: 0,
        refundedCount: 0,
      },
    },
  });
};

module.exports = {
  submitPayment,
  getMyPayments,
  getPaymentById,
  getPaymentByBooking,
  getPendingVerifications,
  verifyPayment,
  getPaymentStats,
};