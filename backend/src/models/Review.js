/**
 * Review Model
 * Customer reviews for lodges
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // References
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
      index: true,
    },
    lodge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lodge',
      required: [true, 'Lodge is required'],
      index: true,
    },
    roomCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomCategory',
    },
    // Rating
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    // Detailed Ratings
    detailedRating: {
      cleanliness: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
    },
    // Content
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    // Media
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],
    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'hidden'],
      default: 'pending',
      index: true,
    },
    // Moderation
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: Date,
    moderationNotes: String,
    // Response from lodge owner
    ownerResponse: {
      comment: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    // Language
    language: {
      type: String,
      enum: ['en', 'te'],
      default: 'en',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
reviewSchema.index({ lodge: 1, status: 1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function () {
  const ratings = this.detailedRating;
  const values = Object.values(ratings).filter((v) => v != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
});

// Pre-save middleware
reviewSchema.pre('save', function (next) {
  // Only allow one review per booking
  // This is enforced by unique index on booking field
  next();
});

// Method to approve review
reviewSchema.methods.approve = async function (moderatedBy, notes = '') {
  this.status = 'approved';
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;

  // Update lodge rating
  const Lodge = mongoose.model('Lodge');
  await Lodge.findByIdAndUpdate(this.lodge, { $inc: { 'rating.count': 1 } });
  const lodge = await Lodge.findById(this.lodge);
  await lodge.updateRating();

  return this.save();
};

// Method to reject review
reviewSchema.methods.reject = async function (moderatedBy, notes = '') {
  this.status = 'rejected';
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;
  return this.save();
};

// Method to add owner response
reviewSchema.methods.addOwnerResponse = async function (respondedBy, comment) {
  this.ownerResponse = {
    comment,
    respondedAt: new Date(),
    respondedBy,
  };
  return this.save();
};

// Static method to get approved reviews for lodge
reviewSchema.statics.getApprovedForLodge = function (lodgeId, options = {}) {
  const { limit = 10, skip = 0, sort = '-createdAt' } = options;
  return this.find({ lodge: lodgeId, status: 'approved' })
    .populate('customer', 'fullName profileImage')
    .populate('roomCategory', 'name')
    .populate('booking', 'checkInDate checkOutDate')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get review statistics for lodge
reviewSchema.statics.getStatisticsForLodge = async function (lodgeId) {
  const stats = await this.aggregate([
    { $match: { lodge: mongoose.Types.ObjectId(lodgeId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
        detailedAverages: {
          $avg: {
            cleanliness: '$detailedRating.cleanliness',
            service: '$detailedRating.service',
            location: '$detailedRating.location',
            valueForMoney: '$detailedRating.valueForMoney',
            amenities: '$detailedRating.amenities',
          },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      detailedAverages: {},
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  stats[0].ratingDistribution.forEach((r) => {
    if (distribution[r] !== undefined) distribution[r]++;
  });

  return {
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    totalReviews: stats[0].totalReviews,
    ratingDistribution: distribution,
    detailedAverages: stats[0].detailedAverages || {},
  };
};

module.exports = mongoose.model('Review', reviewSchema);