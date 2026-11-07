/**
 * Review Controller
 * Handles customer reviews, lodge owner responses, and admin moderation
 */

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Lodge = require('../models/Lodge');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { uploadReviewImage, deleteFile } = require('../utils/cloudinary');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');

/**
 * Create review
 */
const createReview = async (req, res) => {
  const customer = req.user;
  const { bookingId, rating, title, comment, detailedRating } = req.body;

  // Verify booking ownership and completion
  const booking = await Booking.findOne({ _id: bookingId, customer: customer._id });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status !== 'completed') {
    throw new BadRequestError('Can only review completed stays');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new ConflictError('Review already exists for this booking');
  }

  // Process uploaded images
  const images = [];
  if (req.files && req.files.images) {
    for (let i = 0; i < req.files.images.length; i++) {
      const file = req.files.images[i];
      const result = await uploadReviewImage(file.buffer, `review_${bookingId}_${i}`);
      images.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }
  }

  // Create review
  const review = await Review.create({
    booking: bookingId,
    customer: customer._id,
    lodge: booking.lodge,
    roomCategory: booking.roomCategory,
    rating,
    title,
    comment,
    detailedRating: detailedRating || {},
    images,
    status: 'pending',
    language: customer.language || 'en',
  });

  // Notify admins for moderation
  const admins = await require('../models/User').find({ role: 'super_admin', isActive: true });
  for (const admin of admins) {
    await Notification.createNotification({
      user: admin._id,
      type: 'review_received',
      title: 'New Review Submitted',
      message: `New review for ${booking.lodge.name} requires moderation.`,
      relatedEntity: { entityType: 'review', entityId: review._id },
      actionUrl: `/admin/reviews/${review._id}`,
      actionText: 'Moderate',
      priority: 'normal',
    });
  }

  // Notify lodge owner
  const lodge = await Lodge.findById(booking.lodge);
  if (lodge) {
    await Notification.createNotification({
      user: lodge.owner,
      type: 'review_received',
      title: 'New Review Received',
      message: `New review submitted for your lodge "${lodge.name}".`,
      relatedEntity: { entityType: 'review', entityId: review._id },
      priority: 'normal',
    });
  }

  await ActivityLog.log({
    user: customer._id,
    userRole: customer.role,
    userName: customer.fullName,
    action: 'create_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    entityName: `Review for ${lodge?.name}`,
    description: `Submitted ${rating}-star review for booking ${booking.bookingId}`,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully. Awaiting moderation.',
    data: { review },
  });
};

/**
 * Get user's reviews
 */
const getMyReviews = async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate('lodge', 'name')
    .populate('roomCategory', 'name')
    .populate('booking', 'checkInDate checkOutDate')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { reviews },
  });
};

/**
 * Get reviews for a lodge (public)
 */
const getLodgeReviews = async (req, res) => {
  const { lodgeId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.getApprovedForLodge(lodgeId, {
    limit: parseInt(limit),
    skip: (page - 1) * limit,
  });

  const stats = await Review.getStatisticsForLodge(lodgeId);
  const total = await Review.countDocuments({ lodge: lodgeId, status: 'approved' });

  res.json({
    success: true,
    data: {
      reviews,
      stats,
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
 * Get review by ID
 */
const getReviewById = async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate('customer', 'fullName profileImage')
    .populate('lodge', 'name owner')
    .populate('roomCategory', 'name')
    .populate('booking', 'checkInDate checkOutDate')
    .populate('moderatedBy', 'fullName')
    .populate('ownerResponse.respondedBy', 'fullName');

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Check access for non-approved reviews
  if (review.status !== 'approved') {
    const user = req.user;
    if (user.role === 'customer' && review.customer._id.toString() !== user._id.toString()) {
      throw new ForbiddenError('Access denied');
    }
    if (user.role === 'lodge_owner') {
      const lodge = await Lodge.findById(review.lodge._id);
      if (lodge.owner.toString() !== user._id.toString()) {
        throw new ForbiddenError('Access denied');
      }
    }
    if (user.role !== 'super_admin') {
      throw new ForbiddenError('Access denied');
    }
  }

  res.json({
    success: true,
    data: { review },
  });
};

/**
 * Update review (customer)
 */
const updateReview = async (req, res) => {
  const { id } = req.params;

  const review = await Review.findOne({ _id: id, customer: req.user._id });
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (review.status !== 'pending' && review.status !== 'rejected') {
    throw new BadRequestError('Cannot update review in current status');
  }

  const { rating, title, comment, detailedRating } = req.body;
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment) review.comment = comment;
  if (detailedRating) review.detailedRating = detailedRating;

  await review.save();

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'update_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Updated review for booking ${review.booking}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: { review },
  });
};

/**
 * Delete review (customer)
 */
const deleteReview = async (req, res) => {
  const { id } = req.params;

  const review = await Review.findOne({ _id: id, customer: req.user._id });
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (review.status === 'approved') {
    throw new BadRequestError('Cannot delete approved review');
  }

  // Delete images from Cloudinary
  for (const image of review.images) {
    if (image.publicId) await deleteFile(image.publicId);
  }

  await review.deleteOne();

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'delete_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Deleted review for booking ${review.booking}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
};

/**
 * Respond to review (lodge owner)
 */
const respondToReview = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    throw new BadRequestError('Response comment is required');
  }

  const review = await Review.findById(id).populate('lodge');
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Check lodge ownership
  if (review.lodge.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only respond to reviews for your own lodges');
  }

  if (review.status !== 'approved') {
    throw new BadRequestError('Can only respond to approved reviews');
  }

  if (review.ownerResponse) {
    throw new BadRequestError('Response already exists for this review');
  }

  await review.addOwnerResponse(req.user._id, comment);

  // Notify customer
  await Notification.createNotification({
    user: review.customer,
    type: 'review_approved',
    title: 'Lodge Owner Responded to Your Review',
    message: `The owner of ${review.lodge.name} has responded to your review.`,
    relatedEntity: { entityType: 'review', entityId: review._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'respond_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Responded to review for ${review.lodge.name}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Response added successfully',
    data: { review },
  });
};

/**
 * Get pending reviews for moderation (admin)
 */
const getPendingReviews = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const reviews = await Review.find({ status: 'pending' })
    .populate('customer', 'fullName phone')
    .populate('lodge', 'name')
    .populate('booking', 'checkInDate checkOutDate bookingId')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ status: 'pending' });

  res.json({
    success: true,
    data: {
      reviews,
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
 * Approve review (admin)
 */
const approveReview = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await review.approve(req.user._id, notes || '');

  // Notify customer
  await Notification.createNotification({
    user: review.customer,
    type: 'review_approved',
    title: 'Review Approved',
    message: `Your review for ${review.lodge.name} has been approved and is now visible.`,
    relatedEntity: { entityType: 'review', entityId: review._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'approve_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Approved review for ${review.lodge.name}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Review approved successfully',
    data: { review },
  });
};

/**
 * Reject review (admin)
 */
const rejectReview = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!notes) {
    throw new BadRequestError('Rejection reason is required');
  }

  const review = await Review.findById(id);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  await review.reject(req.user._id, notes);

  // Notify customer
  await Notification.createNotification({
    user: review.customer,
    type: 'review_approved',
    title: 'Review Rejected',
    message: `Your review for ${review.lodge.name} was rejected. Reason: ${notes}`,
    relatedEntity: { entityType: 'review', entityId: review._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'reject_review',
    actionCategory: 'review',
    entityType: 'review',
    entityId: review._id,
    description: `Rejected review for ${review.lodge.name}. Reason: ${notes}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Review rejected',
    data: { review },
  });
};

module.exports = {
  createReview,
  getMyReviews,
  getLodgeReviews,
  getReviewById,
  updateReview,
  deleteReview,
  respondToReview,
  getPendingReviews,
  approveReview,
  rejectReview,
};