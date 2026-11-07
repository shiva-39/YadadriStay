/**
 * Validation Middleware
 * Express-validator based validation rules
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Handle validation results
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location,
    }));
    throw new ValidationError('Validation failed', { errors: formattedErrors });
  }
  next();
};

/**
 * Common validation rules
 */
const rules = {
  // Auth
  register: [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
      .optional()
      .isIn(['customer', 'lodge_owner'])
      .withMessage('Invalid role'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
  ],

  login: [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian phone number'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  refreshToken: [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],

  // User
  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Invalid gender'),
    body('language')
      .optional()
      .isIn(['en', 'te'])
      .withMessage('Invalid language'),
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain uppercase, lowercase, and number'),
  ],

  // Lodge
  createLodge: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Lodge name must be between 2 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('address.street')
      .trim()
      .notEmpty()
      .withMessage('Street address is required'),
    body('address.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    body('address.state')
      .optional()
      .trim(),
    body('address.pincode')
      .matches(/^\d{6}$/)
      .withMessage('Invalid pincode format'),
    body('address.coordinates')
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be [longitude, latitude]'),
    body('address.coordinates.*')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid coordinate values'),
    body('contact.phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number'),
    body('contact.alternatePhone')
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number'),
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('facilities')
      .optional()
      .isObject()
      .withMessage('Facilities must be an object'),
  ],

  updateLodge: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Lodge name must be between 2 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('address.street')
      .optional()
      .trim(),
    body('address.city')
      .optional()
      .trim(),
    body('address.pincode')
      .optional()
      .matches(/^\d{6}$/)
      .withMessage('Invalid pincode format'),
    body('address.coordinates')
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be [longitude, latitude]'),
  ],

  // Room Category
  createRoomCategory: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('type')
      .isIn(['single', 'double', 'triple', 'quad', 'family', 'dormitory', 'suite', 'deluxe', 'standard'])
      .withMessage('Invalid room type'),
    body('acType')
      .isIn(['ac', 'non_ac', 'both'])
      .withMessage('Invalid AC type'),
    body('capacity.adults')
      .isInt({ min: 1, max: 10 })
      .withMessage('Adult capacity must be between 1 and 10'),
    body('capacity.children')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Children capacity must be between 0 and 5'),
    body('capacity.maxOccupancy')
      .isInt({ min: 1, max: 15 })
      .withMessage('Max occupancy must be between 1 and 15'),
    body('pricing.basePrice')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    body('pricing.weekendPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weekend price must be a positive number'),
    body('totalRooms')
      .isInt({ min: 1, max: 100 })
      .withMessage('Total rooms must be between 1 and 100'),
  ],

  updateRoomCategory: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('pricing.basePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number'),
    body('totalRooms')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Total rooms must be between 1 and 100'),
  ],

  // Inventory
  updateInventory: [
    body('updates')
      .isArray({ min: 1 })
      .withMessage('Updates array is required'),
    body('updates.*.roomCategoryId')
      .isMongoId()
      .withMessage('Invalid room category ID'),
    body('updates.*.date')
      .isISO8601()
      .withMessage('Invalid date format'),
    body('updates.*.availableRooms')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Available rooms must be a positive number'),
    body('updates.*.blockedRooms')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Blocked rooms must be a positive number'),
    body('updates.*.isClosed')
      .optional()
      .isBoolean()
      .withMessage('isClosed must be a boolean'),
  ],

  // Booking
  createBooking: [
    body('lodgeId').isMongoId().withMessage('Invalid lodge ID'),
    body('roomCategoryId').isMongoId().withMessage('Invalid room category ID'),
    body('checkInDate').isISO8601().withMessage('Invalid check-in date'),
    body('checkOutDate').isISO8601().withMessage('Invalid check-out date'),
    body('guests.adults')
      .isInt({ min: 1 })
      .withMessage('At least 1 adult required'),
    body('guests.children')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Children must be a positive number'),
    body('rooms')
      .isInt({ min: 1 })
      .withMessage('At least 1 room required'),
    body('specialRequests')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Special requests cannot exceed 1000 characters'),
  ],

  // Offline Booking
  createOfflineBooking: [
    body('lodgeId').isMongoId().withMessage('Invalid lodge ID'),
    body('roomCategoryId').isMongoId().withMessage('Invalid room category ID'),
    body('customerName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Customer name must be between 2 and 100 characters'),
    body('customerPhone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number'),
    body('customerEmail')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('checkInDate').isISO8601().withMessage('Invalid check-in date'),
    body('checkOutDate').isISO8601().withMessage('Invalid check-out date'),
    body('guests.adults')
      .isInt({ min: 1 })
      .withMessage('At least 1 adult required'),
    body('guests.children')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Children must be a positive number'),
    body('rooms')
      .isInt({ min: 1 })
      .withMessage('At least 1 room required'),
    body('pricing.totalAmount')
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
    body('payment.method')
      .optional()
      .isIn(['cash', 'upi', 'card', 'bank_transfer', 'other'])
      .withMessage('Invalid payment method'),
  ],

  // Payment
  submitPayment: [
    body('bookingId').isMongoId().withMessage('Invalid booking ID'),
    body('upi.transactionRef')
      .trim()
      .notEmpty()
      .withMessage('Transaction reference is required')
      .isLength({ min: 10, max: 50 })
      .withMessage('Invalid transaction reference'),
    body('upi.transactionDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid transaction date'),
    body('upi.payerName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Payer name too long'),
  ],

  verifyPayment: [
    body('action')
      .isIn(['approve', 'reject'])
      .withMessage('Action must be approve or reject'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('rejectionReason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Rejection reason cannot exceed 500 characters'),
  ],

  // Review
  createReview: [
    body('bookingId').isMongoId().withMessage('Invalid booking ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('comment')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Comment must be between 10 and 5000 characters'),
    body('detailedRating.cleanliness')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Cleanliness rating must be between 1 and 5'),
    body('detailedRating.service')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Service rating must be between 1 and 5'),
    body('detailedRating.location')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Location rating must be between 1 and 5'),
    body('detailedRating.valueForMoney')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Value for money rating must be between 1 and 5'),
    body('detailedRating.amenities')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Amenities rating must be between 1 and 5'),
  ],

  // Complaint
  createComplaint: [
    body('category')
      .isIn([
        'booking_issue',
        'payment_issue',
        'refund_request',
        'lodge_complaint',
        'cleanliness',
        'service_quality',
        'amenities',
        'noise_disturbance',
        'safety_security',
        'cancellation',
        'transport',
        'technical',
        'other',
      ])
      .withMessage('Invalid category'),
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 20, max: 5000 })
      .withMessage('Description must be between 20 and 5000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('lodgeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid lodge ID'),
    body('bookingId')
      .optional()
      .isMongoId()
      .withMessage('Invalid booking ID'),
  ],

  // Transport Request
  createTransportRequest: [
    body('vehicleType')
      .isIn(['auto', 'car', 'van', 'any'])
      .withMessage('Invalid vehicle type'),
    body('passengers')
      .isInt({ min: 1, max: 20 })
      .withMessage('Passengers must be between 1 and 20'),
    body('pickupLocation')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Pickup location must be between 5 and 500 characters'),
    body('destination')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Destination must be between 5 and 500 characters'),
    body('preferredDateTime')
      .isISO8601()
      .withMessage('Invalid date/time format'),
    body('contactPhone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Invalid phone number'),
    body('bookingId')
      .optional()
      .isMongoId()
      .withMessage('Invalid booking ID'),
  ],

  // Search/Filters
  lodgeSearch: [
    query('checkInDate').optional().isISO8601().withMessage('Invalid check-in date'),
    query('checkOutDate').optional().isISO8601().withMessage('Invalid check-out date'),
    query('adults').optional().isInt({ min: 1, max: 10 }).withMessage('Invalid adults count'),
    query('children').optional().isInt({ min: 0, max: 10 }).withMessage('Invalid children count'),
    query('rooms').optional().isInt({ min: 1, max: 10 }).withMessage('Invalid rooms count'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Invalid min price'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Invalid max price'),
    query('acType').optional().isIn(['ac', 'non_ac', 'both']).withMessage('Invalid AC type'),
    query('parking').optional().isBoolean().withMessage('Parking must be boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid limit'),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'distance', 'rating', 'newest']).withMessage('Invalid sort'),
  ],

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
    query('sort').optional().isString().withMessage('Invalid sort parameter'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order'),
  ],

  // MongoDB ID
  mongoId: (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  ],
};

module.exports = {
  handleValidation,
  rules,
};