/**
 * Booking Routes
 * Online booking management
 */

const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireCustomer, requireLodgeOwner, requireSuperAdmin, requireBookingAccess } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');

/**
 * @route POST /api/bookings
 * @desc Create new booking
 * @access Private (Customer)
 */
router.post('/', authenticate, requireCustomer, rules.createBooking, handleValidation, catchAsync(bookingController.createBooking));

/**
 * @route GET /api/bookings
 * @desc Get user's bookings
 * @access Private (Customer)
 */
router.get('/', authenticate, requireCustomer, catchAsync(bookingController.getMyBookings));

/**
 * @route GET /api/bookings/:id
 * @desc Get booking details
 * @access Private (Customer, Lodge Owner, Admin)
 */
router.get('/:id', authenticate, requireBookingAccess, catchAsync(bookingController.getBookingById));

/**
 * @route PUT /api/bookings/:id/cancel
 * @desc Cancel booking
 * @access Private (Customer, Lodge Owner, Admin)
 */
router.put('/:id/cancel', authenticate, requireBookingAccess, catchAsync(bookingController.cancelBooking));

/**
 * @route POST /api/bookings/:id/checkin
 * @desc Check-in guest
 * @access Private (Lodge Owner, Admin)
 */
router.post('/:id/checkin', authenticate, requireBookingAccess, catchAsync(bookingController.checkIn));

/**
 * @route POST /api/bookings/:id/checkout
 * @desc Check-out guest
 * @access Private (Lodge Owner, Admin)
 */
router.post('/:id/checkout', authenticate, requireBookingAccess, catchAsync(bookingController.checkOut));

/**
 * @route GET /api/bookings/:id/receipt
 * @desc Download booking receipt
 * @access Private (Customer, Lodge Owner, Admin)
 */
router.get('/:id/receipt', authenticate, requireBookingAccess, catchAsync(bookingController.downloadReceipt));

// Lodge Owner routes
router.use('/owner', authenticate, requireLodgeOwner);

/**
 * @route GET /api/bookings/owner
 * @desc Get bookings for owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/owner', catchAsync(bookingController.getOwnerBookings));

/**
 * @route GET /api/bookings/owner/:id
 * @desc Get booking details for owner
 * @access Private (Lodge Owner)
 */
router.get('/owner/:id', catchAsync(bookingController.getOwnerBookingById));

/**
 * @route POST /api/bookings/owner/:id/checkin
 * @desc Check-in guest (owner)
 * @access Private (Lodge Owner)
 */
router.post('/owner/:id/checkin', catchAsync(bookingController.ownerCheckIn));

/**
 * @route POST /api/bookings/owner/:id/checkout
 * @desc Check-out guest (owner)
 * @access Private (Lodge Owner)
 */
router.post('/owner/:id/checkout', catchAsync(bookingController.ownerCheckOut));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/bookings/admin
 * @desc Get all bookings (admin)
 * @access Private (Super Admin)
 */
router.get('/admin', catchAsync(bookingController.getAllBookings));

/**
 * @route GET /api/bookings/admin/:id
 * @desc Get booking by ID (admin)
 * @access Private (Super Admin)
 */
router.get('/admin/:id', catchAsync(bookingController.getBookingByIdAdmin));

/**
 * @route PUT /api/bookings/admin/:id/status
 * @desc Update booking status (admin)
 * @access Private (Super Admin)
 */
router.put('/admin/:id/status', catchAsync(bookingController.updateBookingStatus));

module.exports = router;