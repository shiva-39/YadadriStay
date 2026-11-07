/**
 * Offline Booking Model
 * Walk-in/direct bookings recorded by lodge owners
 */

const mongoose = require('mongoose');

const offlineBookingSchema = new mongoose.Schema(
  {
    // Booking Reference
    bookingId: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    // References
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
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorded by is required'],
      index: true,
    },
    // Guest Details
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    customerIdProof: {
      type: String, // Aadhaar, PAN, etc.
      trim: true,
    },
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
        required: true,
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
      required: true,
      min: 1,
    },
    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
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
      totalAmount: {
        type: Number,
        required: true,
      },
      advanceAmount: {
        type: Number,
        default: 0,
      },
      remainingAmount: {
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
        },
      ],
    },
    // Payment Details
    payment: {
      method: {
        type: String,
        enum: ['cash', 'upi', 'card', 'bank_transfer', 'other'],
        default: 'cash',
      },
      status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'refunded'],
        default: 'pending',
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      transactionRef: String,
      paymentDate: Date,
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Status
    status: {
      type: String,
      enum: ['confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'],
      default: 'confirmed',
      index: true,
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
    // Cancellation
    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      refundAmount: { type: Number, default: 0 },
    },
    // Notes
    notes: String,
    internalNotes: String,
    // Source
    source: {
      type: String,
      enum: ['walk_in', 'phone', 'whatsapp', 'other'],
      default: 'walk_in',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
offlineBookingSchema.index({ lodge: 1, status: 1 });
offlineBookingSchema.index({ lodge: 1, checkInDate: 1, checkOutDate: 1 });
offlineBookingSchema.index({ recordedBy: 1, createdAt: -1 });
offlineBookingSchema.index({ customerPhone: 1 });
offlineBookingSchema.index({ bookingId: 1 });

// Virtual for total guests
offlineBookingSchema.virtual('totalGuests').get(function () {
  return this.guests.adults + this.guests.children;
});

// Pre-save middleware
offlineBookingSchema.pre('save', function (next) {
  // Generate booking ID if not present
  if (!this.bookingId) {
    const prefix = 'YSOFF';
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingId = `${prefix}${datePart}${randomPart}`;
  }

  // Calculate total guests
  this.guests.total = this.guests.adults + this.guests.children;

  // Calculate nights if not set
  if (!this.nights && this.checkInDate && this.checkOutDate) {
    const diffTime = this.checkOutDate - this.checkInDate;
    this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate remaining amount
  if (this.pricing.totalAmount && this.pricing.advanceAmount !== undefined) {
    this.pricing.remainingAmount = this.pricing.totalAmount - this.pricing.advanceAmount;
  }

  next();
});

// Method to calculate pricing
offlineBookingSchema.methods.calculatePricing = function (roomCategory) {
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
    });

    totalRoomCharges += nightPrice;
  }

  totalRoomCharges *= this.rooms;

  const taxAmount = (totalRoomCharges * (this.lodge?.pricing?.taxPercentage || 18)) / 100;
  const serviceChargeAmount = (totalRoomCharges * (this.lodge?.pricing?.serviceChargePercentage || 0)) / 100;
  const totalAmount = totalRoomCharges + taxAmount + serviceChargeAmount - (this.pricing.discountAmount || 0);

  this.pricing = {
    basePrice: roomCategory.pricing.basePrice,
    totalRoomCharges: Math.round(totalRoomCharges),
    taxAmount: Math.round(taxAmount),
    serviceChargeAmount: Math.round(serviceChargeAmount),
    discountAmount: this.pricing.discountAmount || 0,
    totalAmount: Math.round(totalAmount),
    advanceAmount: this.pricing.advanceAmount || 0,
    remainingAmount: Math.round(totalAmount - (this.pricing.advanceAmount || 0)),
    currency: 'INR',
    priceBreakdown,
  };

  return this.pricing;
};

// Method to check in
offlineBookingSchema.methods.checkInGuest = async function (checkedInBy) {
  this.status = 'checked_in';
  this.checkIn = {
    checkedInAt: new Date(),
    checkedInBy,
    actualCheckInTime: new Date().toTimeString().slice(0, 5),
  };
  return this.save();
};

// Method to check out
offlineBookingSchema.methods.checkOutGuest = async function (checkedOutBy) {
  this.status = 'completed';
  this.checkOut = {
    checkedOutAt: new Date(),
    checkedOutBy,
    actualCheckOutTime: new Date().toTimeString().slice(0, 5),
  };
  return this.save();
};

// Method to cancel
offlineBookingSchema.methods.cancel = async function (cancelledBy, reason, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason,
    refundAmount,
  };

  // Release inventory
  const RoomInventory = mongoose.model('RoomInventory');
  await RoomInventory.releaseBooking(
    this.lodge,
    this.roomCategory,
    this.checkInDate,
    this.checkOutDate,
    this.rooms,
    this._id,
    'offline'
  );

  return this.save();
};

// Method to record payment
offlineBookingSchema.methods.recordPayment = async function (amount, method, transactionRef, collectedBy) {
  this.payment.paidAmount += amount;
  this.payment.method = method;
  this.payment.transactionRef = transactionRef;
  this.payment.paymentDate = new Date();
  this.payment.collectedBy = collectedBy;

  if (this.payment.paidAmount >= this.pricing.totalAmount) {
    this.payment.status = 'paid';
  } else if (this.payment.paidAmount > 0) {
    this.payment.status = 'partial';
  }

  return this.save();
};

// Static method to get statistics
offlineBookingSchema.statics.getStatistics = async function (filters = {}) {
  const matchStage = {};

  if (filters.lodge) matchStage.lodge = filters.lodge;
  if (filters.recordedBy) matchStage.recordedBy = filters.recordedBy;
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
        paidAmount: { $sum: '$payment.paidAmount' },
      },
    },
  ]);
};

module.exports = mongoose.model('OfflineBooking', offlineBookingSchema);