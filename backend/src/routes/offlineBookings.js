/**
 * Offline Booking Routes
 * Walk-in/direct booking management for lodge owners
 */

const express = require('express');
const router = express.Router();

const offlineBookingController = require('../controllers/offlineBookingController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireLodgeOwner, requireRoomCategoryOwnership } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');

/**
 * @route POST /api/offline-bookings
 * @desc Create offline booking
 * @access Private (Lodge Owner)
 */
router.post('/', authenticate, requireLodgeOwner, requireRoomCategoryOwnership, rules.createOfflineBooking, handleValidation, catchAsync(offlineBookingController.createOfflineBooking));

/**
 * @route GET /api/offline-bookings
 * @desc Get offline bookings for owner's lodges
 * @access Private (Lodge Owner)
 */
router.get('/', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.getOfflineBookings));

/**
 * @route GET /api/offline-bookings/:id
 * @desc Get offline booking details
 * @access Private (Lodge Owner, Admin)
 */
router.get('/:id', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.getOfflineBookingById));

/**
 * @route PUT /api/offline-bookings/:id
 * @desc Update offline booking
 * @access Private (Lodge Owner)
 */
router.put('/:id', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.updateOfflineBooking));

/**
 * @route PUT /api/offline-bookings/:id/cancel
 * @desc Cancel offline booking
 * @access Private (Lodge Owner)
 */
router.put('/:id/cancel', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.cancelOfflineBooking));

/**
 * @route POST /api/offline-bookings/:id/checkin
 * @desc Check-in guest
 * @access Private (Lodge Owner)
 */
router.post('/:id/checkin', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.checkIn));

/**
 * @route POST /api/offline-bookings/:id/checkout
 * @desc Check-out guest
 * @access Private (Lodge Owner)
 */
router.post('/:id/checkout', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.checkOut));

/**
 * @route POST /api/offline-bookings/:id/payment
 * @desc Record payment for offline booking
 * @access Private (Lodge Owner)
 */
router.post('/:id/payment', authenticate, requireLodgeOwner, catchAsync(offlineBookingController.recordPayment));

module.exports = router;