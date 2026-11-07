/**
 * Lodge Model
 * Represents a lodge/hotel property
 */

const mongoose = require('mongoose');

const lodgeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lodge owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Lodge name is required'],
      trim: true,
      maxlength: [200, 'Lodge name cannot exceed 200 characters'],
      index: 'text',
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    // Address and Location
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        default: 'Telangana',
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
        match: [/^\d{6}$/, 'Invalid pincode format'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates are required'],
        index: '2dsphere',
        validate: {
          validator: function (v) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates format [longitude, latitude]',
        },
      },
      landmark: String,
      distanceFromTemple: {
        type: Number, // in kilometers
        min: 0,
      },
    },
    // Contact Information
    contact: {
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
      },
      alternatePhone: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      whatsappNumber: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
      },
    },
    // Media
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        caption: String,
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    videos: [
      {
        url: { type: String, required: true },
        publicId: String,
        caption: String,
        thumbnail: String,
        order: { type: Number, default: 0 },
      },
    ],
    // Facilities
    facilities: {
      parking: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      nonAc: { type: Boolean, default: false },
      restaurant: { type: Boolean, default: false },
      roomService: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      pickupDrop: { type: Boolean, default: false },
      hotWater: { type: Boolean, default: false },
      powerBackup: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
      lift: { type: Boolean, default: false },
      other: [String],
    },
    // Policies
    policies: {
      checkInTime: {
        type: String,
        default: '12:00',
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
      },
      checkOutTime: {
        type: String,
        default: '11:00',
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
      },
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict', 'custom'],
        default: 'moderate',
      },
      customCancellationPolicy: String,
      advancePaymentPercentage: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      allowPets: { type: Boolean, default: false },
      allowSmoking: { type: Boolean, default: false },
      allowUnmarriedCouples: { type: Boolean, default: true },
      minAge: { type: Number, default: 18 },
    },
    // Status and Approval
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'suspended', 'deactivated'],
      default: 'draft',
      index: true,
    },
    approvalNotes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    rejectionReason: String,
    // Pricing
    pricing: {
      basePrice: { type: Number, default: 0, min: 0 }, // Minimum room price
      currency: { type: String, default: 'INR' },
      taxPercentage: { type: Number, default: 18, min: 0, max: 100 },
      serviceChargePercentage: { type: Number, default: 0, min: 0, max: 100 },
    },
    // Ratings
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    // Statistics
    stats: {
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      occupancyRate: { type: Number, default: 0 },
      averageStayDuration: { type: Number, default: 0 },
    },
    // SEO and Marketing
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    // Featured/Priority
    isFeatured: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    // Timestamps
    publishedAt: Date,
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for room categories
lodgeSchema.virtual('roomCategories', {
  ref: 'RoomCategory',
  localField: '_id',
  foreignField: 'lodge',
});

// Virtual for bookings
lodgeSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'lodge',
});

// Virtual for primary image
lodgeSchema.virtual('primaryImage').get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary ? primary.url : this.images[0]?.url || null;
});

// Virtual for distance from temple (calculated)
lodgeSchema.virtual('calculatedDistanceFromTemple').get(function () {
  if (this.address.coordinates && process.env.TEMPLE_COORDINATES) {
    const templeCoords = process.env.TEMPLE_COORDINATES.split(',').map(Number);
    if (templeCoords.length === 2) {
      return calculateDistance(this.address.coordinates, templeCoords);
    }
  }
  return this.address.distanceFromTemple;
});

// Pre-save middleware to generate slug
lodgeSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }
  if (this.isModified('status') && this.status === 'approved' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Method to update rating
lodgeSchema.methods.updateRating = async function () {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { lodge: this._id, status: 'approved' } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        breakdown: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (stats.length > 0) {
    this.rating.average = Math.round(stats[0].average * 10) / 10;
    this.rating.count = stats[0].count;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats[0].breakdown.forEach((r) => {
      if (breakdown[r] !== undefined) breakdown[r]++;
    });
    this.rating.breakdown = breakdown;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
    this.rating.breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }

  await this.save();
  return this.rating;
};

// Static method for searching lodges
lodgeSchema.statics.search = function (filters = {}) {
  const query = { status: 'approved', isActive: { $ne: false } };

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.minPrice || filters.maxPrice) {
    query['pricing.basePrice'] = {};
    if (filters.minPrice) query['pricing.basePrice'].$gte = filters.minPrice;
    if (filters.maxPrice) query['pricing.basePrice'].$lte = filters.maxPrice;
  }

  if (filters.facilities) {
    const facilityQueries = [];
    Object.entries(filters.facilities).forEach(([key, value]) => {
      if (value) facilityQueries.push({ [`facilities.${key}`]: true });
    });
    if (facilityQueries.length > 0) query.$and = facilityQueries;
  }

  if (filters.coordinates && filters.maxDistance) {
    query['address.coordinates'] = {
      $near: {
        $geometry: { type: 'Point', coordinates: filters.coordinates },
        $maxDistance: filters.maxDistance * 1000, // Convert km to meters
      },
    };
  }

  return this.find(query).sort({ priority: -1, isFeatured: -1, 'rating.average': -1 });
};

// Indexes
lodgeSchema.index({ owner: 1, status: 1 });
lodgeSchema.index({ 'address.city': 1, 'address.pincode': 1 });
lodgeSchema.index({ 'address.coordinates': '2dsphere' });
lodgeSchema.index({ status: 1, isActive: 1 });
lodgeSchema.index({ isFeatured: -1, priority: -1 });
lodgeSchema.index({ createdAt: -1 });

// Helper function to calculate distance between two coordinates
function calculateDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = mongoose.model('Lodge', lodgeSchema);