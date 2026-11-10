/**
 * Booking Model
 * Online bookings made by customers
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // Booking Reference
    bookingId: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    // References
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
      required: [true, 'Room category is required'],
      index: true,
    },
    // Guest Details
    guests: {
      adults: {
        type: Number,
        required: [true, 'Number of adults is required'],
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        default: 0, // Calculated in pre-save hook
      },
    },
    rooms: {
      type: Number,
      required: [true, 'Number of rooms is required'],
      min: 1,
    },
    // Dates
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
      index: true,
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
      index: true,
    },
    nights: {
      type: Number,
      default: 1, // Calculated in pre-save hook
      min: 1,
    },
    // Pricing (snapshot at booking time)
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      weekendPrice: Number,
      holidayPrice: Number,
      totalRoomCharges: {
        type: Number,
        required: true,
      },
      taxAmount: {
        type: Number,
        default: 0,
      },
      serviceChargeAmount: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      advancePercentage: {
        type: Number,
        required: true,
      },
      advanceAmount: {
        type: Number,
        required: true,
      },
      remainingAmount: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      priceBreakdown: [
        {
          date: Date,
          price: Number,
          isWeekend: Boolean,
          isHoliday: Boolean,
        },
      ],
    },
    // Status
    status: {
      type: String,
      enum: [
        'pending_payment',
        'pending_verification',
        'confirmed',
        'checked_in',
        'completed',
        'cancelled',
        'refunded',
        'no_show',
        'expired',
      ],
      default: 'pending_payment',
      index: true,
    },
    // Payment Reference
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    // Cancellation
    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      refundAmount: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed'],
        default: 'none',
      },
      refundProcessedAt: Date,
      refundProcessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Check-in/Check-out
    checkIn: {
      checkedInAt: Date,
      checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      actualCheckInTime: String,
    },
    checkOut: {
      checkedOutAt: Date,
      checkedOutBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      actualCheckOutTime: String,
    },
    // Special Requests
    specialRequests: String,
    // Communication
    contactPhone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
    },
    contactEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    // Notifications
    notificationsSent: {
      bookingConfirmation: { type: Boolean, default: false },
      paymentReminder: { type: Boolean, default: false },
      checkInReminder: { type: Boolean, default: false },
      checkOutReminder: { type: Boolean, default: false },
    },
    // Source
    source: {
      type: String,
      enum: ['android_app', 'owner_dashboard', 'admin_dashboard', 'walk_in'],
      default: 'android_app',
    },
    // Notes
    internalNotes: String,
    customerNotes: String,
    // Timestamps
    confirmedAt: Date,
    expiresAt: Date, // For pending_payment status
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ lodge: 1, status: 1 });
bookingSchema.index({ lodge: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ 'payment': 1 });

// Virtual for booking duration
bookingSchema.virtual('duration').get(function () {
  return this.nights;
});

// Virtual for isActive
bookingSchema.virtual('isActive').get(function () {
  return ['confirmed', 'checked_in', 'pending_payment', 'pending_verification'].includes(this.status);
});

// Virtual for canCancel
bookingSchema.virtual('canCancel').get(function () {
  if (!['pending_payment', 'pending_verification', 'confirmed'].includes(this.status)) return false;
  const now = new Date();
  const checkIn = new Date(this.checkInDate);
  return checkIn > now;
});

// Pre-save middleware
bookingSchema.pre('save', function (next) {
  // Generate booking ID if not present
  if (!this.bookingId) {
    const prefix = 'YS';
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingId = `${prefix}${datePart}${randomPart}`;
  }

  // Calculate total guests
  this.guests.total = this.guests.adults + this.guests.children;

  // Calculate nights if not set
  if (!this.nights && this.checkInDate && this.checkOutDate) {
    const diffTime = this.checkOutDate - this.checkInDate;
    this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Set expiry for pending_payment (10 minutes)
  if (this.status === 'pending_payment' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  }

  // Set confirmedAt when status changes to confirmed
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }

  next();
});

// Method to calculate pricing
bookingSchema.methods.calculatePricing = function (roomCategory, advancePercentage) {
  const checkIn = new Date(this.checkInDate);
  const checkOut = new Date(this.checkOutDate);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  let totalRoomCharges = 0;
  const priceBreakdown = [];

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkIn);
    currentDate.setDate(currentDate.getDate() + i);

    let nightPrice = roomCategory.pricing.basePrice;
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && roomCategory.pricing.weekendPrice) {
      nightPrice = roomCategory.pricing.weekendPrice;
    }

    priceBreakdown.push({
      date: new Date(currentDate),
      price: nightPrice,
      isWeekend,
      isHoliday: false, // Would need holiday calendar
    });

    totalRoomCharges += nightPrice;
  }

  totalRoomCharges *= this.rooms;

  const taxAmount = (totalRoomCharges * (this.lodge?.pricing?.taxPercentage || 18)) / 100;
  const serviceChargeAmount = (totalRoomCharges * (this.lodge?.pricing?.serviceChargePercentage || 0)) / 100;
  const subtotal = totalRoomCharges + taxAmount + serviceChargeAmount;
  const advanceAmount = Math.round((subtotal * advancePercentage) / 100);
  const remainingAmount = subtotal - advanceAmount;

  this.pricing = {
    basePrice: roomCategory.pricing.basePrice,
    weekendPrice: roomCategory.pricing.weekendPrice,
    holidayPrice: roomCategory.pricing.holidayPrice,
    totalRoomCharges: Math.round(totalRoomCharges),
    taxAmount: Math.round(taxAmount),
    serviceChargeAmount: Math.round(serviceChargeAmount),
    discountAmount: 0,
    advancePercentage,
    advanceAmount,
    remainingAmount: Math.round(remainingAmount),
    totalAmount: Math.round(subtotal),
    currency: 'INR',
    priceBreakdown,
  };

  return this.pricing;
};

// Method to cancel booking
bookingSchema.methods.cancel = async function (cancelledBy, reason, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason,
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : 'none',
  };

  // Release inventory (with fallback for standalone MongoDB)
  const RoomInventory = mongoose.model('RoomInventory');
  await RoomInventory.releaseBookingUnified(
    this.lodge,
    this.roomCategory,
    this.checkInDate,
    this.checkOutDate,
    this.rooms,
    this._id,
    'online'
  );

  return this.save();
};

// Method to check in
bookingSchema.methods.checkInGuest = async function (checkedInBy) {
  this.status = 'checked_in';
  this.checkIn = {
    checkedInAt: new Date(),
    checkedInBy,
    actualCheckInTime: new Date().toTimeString().slice(0, 5),
  };
  return this.save();
};

// Method to check out
bookingSchema.methods.checkOutGuest = async function (checkedOutBy) {
  this.status = 'completed';
  this.checkOut = {
    checkedOutAt: new Date(),
    checkedOutBy,
    actualCheckOutTime: new Date().toTimeString().slice(0, 5),
  };
  return this.save();
};

// Static method to find expired pending bookings
bookingSchema.statics.findExpiredPending = function () {
  return this.find({
    status: 'pending_payment',
    expiresAt: { $lt: new Date() },
  });
};

// Static method to get booking statistics
bookingSchema.statics.getStatistics = async function (filters = {}) {
  const matchStage = {};

  if (filters.lodge) matchStage.lodge = filters.lodge;
  if (filters.customer) matchStage.customer = filters.customer;
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
        advanceAmount: { $sum: '$pricing.advanceAmount' },
      },
    },
  ]);
};

module.exports = mongoose.model('Booking', bookingSchema);