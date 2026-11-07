/**
 * Settlement Model
 * Tracks platform-to-lodge-owner settlements for advance payments
 */

const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    // Settlement Reference
    settlementId: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    // References
    lodgeOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lodge owner is required'],
      index: true,
    },
    lodge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lodge',
      required: [true, 'Lodge is required'],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment is required'],
      index: true,
    },
    // Amounts
    advanceReceived: {
      type: Number,
      required: [true, 'Advance received is required'],
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxOnFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    settlementAmount: {
      type: Number,
      required: [true, 'Settlement amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    // Settlement Details
    settlementDate: {
      type: Date,
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transactionRef: String,
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cash', 'cheque', 'other'],
      default: 'bank_transfer',
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    // Notes
    notes: String,
    failureReason: String,
    // Cycle
    settlementCycle: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },
    cycleStartDate: Date,
    cycleEndDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
settlementSchema.index({ lodgeOwner: 1, status: 1 });
settlementSchema.index({ lodge: 1, status: 1 });
settlementSchema.index({ settlementId: 1 });
settlementSchema.index({ settlementDate: -1 });
settlementSchema.index({ cycleStartDate: 1, cycleEndDate: 1 });

// Virtual for net amount
settlementSchema.virtual('netAmount').get(function () {
  return this.settlementAmount - this.platformFee - this.taxOnFee;
});

// Pre-save middleware
settlementSchema.pre('save', function (next) {
  if (!this.settlementId) {
    const prefix = 'SET';
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.settlementId = `${prefix}${datePart}${randomPart}`;
  }

  // Calculate settlement amount if not set
  if (!this.settlementAmount && this.advanceReceived) {
    this.settlementAmount = this.advanceReceived - (this.platformFee || 0) - (this.taxOnFee || 0);
  }

  next();
});

// Static method to create settlement from payment
settlementSchema.statics.createFromPayment = async function (payment) {
  const Booking = mongoose.model('Booking');
  const Lodge = mongoose.model('Lodge');
  const User = mongoose.model('User');

  const booking = await Booking.findById(payment.booking).populate('lodge');
  if (!booking) return null;

  const lodge = await Lodge.findById(booking.lodge).populate('owner');
  if (!lodge || !lodge.owner) return null;

  const owner = await User.findById(lodge.owner);
  if (!owner) return null;

  // Check if settlement already exists
  const existing = await this.findOne({ payment: payment._id });
  if (existing) return existing;

  const advancePercentage = booking.pricing.advancePercentage;
  const platformFeePercentage = 0; // No platform fee initially
  const taxPercentage = 18; // GST on platform fee

  const platformFee = (payment.amount * platformFeePercentage) / 100;
  const taxOnFee = (platformFee * taxPercentage) / 100;
  const settlementAmount = payment.amount - platformFee - taxOnFee;

  // Determine cycle dates
  const now = new Date();
  let cycleStartDate, cycleEndDate;

  if (owner.settlementCycle === 'weekly') {
    const day = now.getDay(); // 0 = Sunday
    cycleStartDate = new Date(now);
    cycleStartDate.setDate(now.getDate() - day);
    cycleStartDate.setHours(0, 0, 0, 0);
    cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setDate(cycleStartDate.getDate() + 6);
    cycleEndDate.setHours(23, 59, 59, 999);
  } else if (owner.settlementCycle === 'biweekly') {
    const date = now.getDate();
    if (date <= 15) {
      cycleStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      cycleEndDate = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
    } else {
      cycleStartDate = new Date(now.getFullYear(), now.getMonth(), 16);
      cycleEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  } else {
    // Monthly
    cycleStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    cycleEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const settlement = await this.create({
    lodgeOwner: owner._id,
    lodge: lodge._id,
    booking: booking._id,
    payment: payment._id,
    advanceReceived: payment.amount,
    platformFee: Math.round(platformFee),
    taxOnFee: Math.round(taxOnFee),
    settlementAmount: Math.round(settlementAmount),
    settlementCycle: owner.settlementCycle,
    cycleStartDate,
    cycleEndDate,
    bankDetails: owner.bankDetails,
  });

  // Update owner's pending settlement amount
  owner.pendingSettlementAmount += settlement.settlementAmount;
  await owner.save();

  return settlement;
};

// Method to mark as processing
settlementSchema.methods.markProcessing = function (processedBy) {
  this.status = 'processing';
  this.processedBy = processedBy;
  this.processedAt = new Date();
  return this.save();
};

// Method to complete settlement
settlementSchema.methods.complete = async function (processedBy, transactionRef, paymentMethod = 'bank_transfer') {
  this.status = 'completed';
  this.settlementDate = new Date();
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.transactionRef = transactionRef;
  this.paymentMethod = paymentMethod;
  await this.save();

  // Update owner's pending settlement amount
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.lodgeOwner, {
    $inc: { pendingSettlementAmount: -this.settlementAmount },
  });

  return this;
};

// Method to fail settlement
settlementSchema.methods.fail = function (processedBy, reason) {
  this.status = 'failed';
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.failureReason = reason;
  return this.save();
};

// Static method to get pending settlements for owner
settlementSchema.statics.getPendingForOwner = function (ownerId) {
  return this.find({ lodgeOwner: ownerId, status: 'pending' })
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .populate('lodge', 'name')
    .populate('payment', 'paymentId upi.transactionRef')
    .sort({ createdAt: 1 });
};

// Static method to get settlements for cycle
settlementSchema.statics.getForCycle = function (ownerId, cycleStartDate, cycleEndDate) {
  return this.find({
    lodgeOwner: ownerId,
    cycleStartDate: { $gte: cycleStartDate },
    cycleEndDate: { $lte: cycleEndDate },
  })
    .populate('booking', 'bookingId checkInDate checkOutDate pricing')
    .populate('lodge', 'name')
    .populate('payment', 'paymentId')
    .sort({ createdAt: 1 });
};

// Static method to get settlement statistics
settlementSchema.statics.getStatistics = async function (filters = {}) {
  const matchStage = {};

  if (filters.lodgeOwner) matchStage.lodgeOwner = filters.lodgeOwner;
  if (filters.lodge) matchStage.lodge = filters.lodge;
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
        totalAdvanceReceived: { $sum: '$advanceReceived' },
        totalPlatformFee: { $sum: '$platformFee' },
        totalTaxOnFee: { $sum: '$taxOnFee' },
        totalSettlementAmount: { $sum: '$settlementAmount' },
      },
    },
  ]);
};

module.exports = mongoose.model('Settlement', settlementSchema);