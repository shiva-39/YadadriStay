/**
 * Review Routes
 * Customer reviews and lodge owner responses
 */

const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireCustomer, requireLodgeOwner, requireSuperAdmin } = require('../middleware/authorization');
const { catchAsync } = require('../middleware/errorHandler');
const { handleValidation, rules } = require('../middleware/validation');
const { uploadReviewImages, handleUploadError } = require('../middleware/upload');

/**
 * @route POST /api/reviews
 * @desc Create review
 * @access Private (Customer)
 */
router.post('/', authenticate, requireCustomer, uploadReviewImages, handleUploadError, rules.createReview, handleValidation, catchAsync(reviewController.createReview));

/**
 * @route GET /api/reviews
 * @desc Get user's reviews
 * @access Private (Customer)
 */
router.get('/', authenticate, requireCustomer, catchAsync(reviewController.getMyReviews));

/**
 * @route GET /api/reviews/lodge/:lodgeId
 * @desc Get reviews for a lodge (public)
 * @access Public
 */
router.get('/lodge/:lodgeId', catchAsync(reviewController.getLodgeReviews));

/**
 * @route GET /api/reviews/:id
 * @desc Get review by ID
 * @access Private (Customer, Lodge Owner, Admin)
 */
router.get('/:id', authenticate, catchAsync(reviewController.getReviewById));

/**
 * @route PUT /api/reviews/:id
 * @desc Update review (customer)
 * @access Private (Customer)
 */
router.put('/:id', authenticate, requireCustomer, catchAsync(reviewController.updateReview));

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete review (customer)
 * @access Private (Customer)
 */
router.delete('/:id', authenticate, requireCustomer, catchAsync(reviewController.deleteReview));

// Lodge Owner routes
router.use('/owner', authenticate, requireLodgeOwner);

/**
 * @route POST /api/reviews/owner/:id/respond
 * @desc Respond to review
 * @access Private (Lodge Owner)
 */
router.post('/owner/:id/respond', catchAsync(reviewController.respondToReview));

// Admin routes
router.use('/admin', authenticate, requireSuperAdmin);

/**
 * @route GET /api/reviews/admin/pending
 * @desc Get pending reviews for moderation
 * @access Private (Super Admin)
 */
router.get('/admin/pending', catchAsync(reviewController.getPendingReviews));

/**
 * @route PUT /api/reviews/admin/:id/approve
 * @desc Approve review
 * @access Private (Super Admin)
 */
router.put('/admin/:id/approve', catchAsync(reviewController.approveReview));

/**
 * @route PUT /api/reviews/admin/:id/reject
 * @desc Reject review
 * @access Private (Super Admin)
 */
router.put('/admin/:id/reject', catchAsync(reviewController.rejectReview));

module.exports = router;