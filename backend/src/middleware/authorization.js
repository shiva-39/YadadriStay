/**
 * Authorization Middleware
 * Role-based access control and resource ownership verification
 */

const { ForbiddenError, NotFoundError } = require('../utils/errors');

/**
 * Check if user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

/**
 * Check if user is super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * Check if user is lodge owner
 */
const requireLodgeOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'lodge_owner') {
    return res.status(403).json({
      success: false,
      message: 'Lodge owner access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * Check if user is customer
 */
const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Customer access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * Check if user owns the lodge (for lodge owner dashboard)
 */
const requireLodgeOwnership = async (req, res, next) => {
  try {
    const Lodge = require('../models/Lodge');

    const lodgeId = req.params.lodgeId || req.body.lodgeId || req.query.lodgeId;

    if (!lodgeId) {
      return res.status(400).json({
        success: false,
        message: 'Lodge ID is required',
        code: 'BAD_REQUEST',
      });
    }

    const lodge = await Lodge.findById(lodgeId);

    if (!lodge) {
      throw new NotFoundError('Lodge not found');
    }

    // Super admin can access all lodges
    if (req.user.role === 'super_admin') {
      req.lodge = lodge;
      return next();
    }

    // Check ownership
    if (lodge.owner.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not own this lodge');
    }

    req.lodge = lodge;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the room category
 */
const requireRoomCategoryOwnership = async (req, res, next) => {
  try {
    const RoomCategory = require('../models/RoomCategory');

    const categoryId = req.params.categoryId || req.body.roomCategory || req.query.roomCategory;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Room category ID is required',
        code: 'BAD_REQUEST',
      });
    }

    const category = await RoomCategory.findById(categoryId).populate('lodge');

    if (!category) {
      throw new NotFoundError('Room category not found');
    }

    // Super admin can access all
    if (req.user.role === 'super_admin') {
      req.roomCategory = category;
      return next();
    }

    // Check lodge ownership
    if (category.lodge.owner.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not own this room category');
    }

    req.roomCategory = category;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns the booking (customer) or owns the lodge (owner)
 */
const requireBookingAccess = async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');

    const bookingId = req.params.bookingId || req.params.id || req.body.bookingId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        code: 'BAD_REQUEST',
      });
    }

    const booking = await Booking.findById(bookingId).populate('lodge');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Super admin can access all
    if (req.user.role === 'super_admin') {
      req.booking = booking;
      return next();
    }

    // Customer can access their own bookings
    if (req.user.role === 'customer' && booking.customer.toString() === req.user._id.toString()) {
      req.booking = booking;
      return next();
    }

    // Lodge owner can access bookings for their lodges
    if (req.user.role === 'lodge_owner' && booking.lodge.owner.toString() === req.user._id.toString()) {
      req.booking = booking;
      return next();
    }

    throw new ForbiddenError('You do not have access to this booking');
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can access payment
 */
const requirePaymentAccess = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');

    const paymentId = req.params.paymentId || req.params.id || req.body.paymentId;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
        code: 'BAD_REQUEST',
      });
    }

    const payment = await Payment.findById(paymentId).populate('booking').populate('lodge');

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Super admin can access all
    if (req.user.role === 'super_admin') {
      req.payment = payment;
      return next();
    }

    // Customer can access their own payments
    if (req.user.role === 'customer' && payment.customer.toString() === req.user._id.toString()) {
      req.payment = payment;
      return next();
    }

    // Lodge owner can access payments for their lodges
    if (req.user.role === 'lodge_owner' && payment.lodge.owner.toString() === req.user._id.toString()) {
      req.payment = payment;
      return next();
    }

    throw new ForbiddenError('You do not have access to this payment');
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can access settlement
 */
const requireSettlementAccess = async (req, res, next) => {
  try {
    const Settlement = require('../models/Settlement');

    const settlementId = req.params.settlementId || req.params.id || req.body.settlementId;

    if (!settlementId) {
      return res.status(400).json({
        success: false,
        message: 'Settlement ID is required',
        code: 'BAD_REQUEST',
      });
    }

    const settlement = await Settlement.findById(settlementId).populate('lodge').populate('lodgeOwner');

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    // Super admin can access all
    if (req.user.role === 'super_admin') {
      req.settlement = settlement;
      return next();
    }

    // Lodge owner can access their own settlements
    if (req.user.role === 'lodge_owner' && settlement.lodgeOwner.toString() === req.user._id.toString()) {
      req.settlement = settlement;
      return next();
    }

    throw new ForbiddenError('You do not have access to this settlement');
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting for sensitive operations
 */
const sensitiveOperationLimiter = (maxAttempts = 5, windowMinutes = 15) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.user._id}:${req.path}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Please try again after ${windowMinutes} minutes.`,
        code: 'RATE_LIMITED',
      });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};

module.exports = {
  authorize,
  requireSuperAdmin,
  requireLodgeOwner,
  requireCustomer,
  requireLodgeOwnership,
  requireRoomCategoryOwnership,
  requireBookingAccess,
  requirePaymentAccess,
  requireSettlementAccess,
  sensitiveOperationLimiter,
};