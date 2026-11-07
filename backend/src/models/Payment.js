/**
 * Payment Model
 * Tracks advance payments for online bookings
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Payment Reference
    paymentId: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
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
    // Amounts
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // UPI Details
    upi: {
      vpa: {
        type: String,
        required: true,
      },
      transactionRef: {
        type: String,
        required: [true, 'UPI transaction reference is required'],
        trim: true,
        uppercase: true,
        index: true,
      },
      transactionDate: Date,
      bankReference: String,
      payerName: String,
      payerVPA: String,
    },
    // Screenshot Evidence
    screenshot: {
      url: {
        type: String,
        required: [true, 'Payment screenshot is required'],
      },
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      fileSize: Number,
      mimeType: String,
    },
    // Status
    status: {
      type: String,
      enum: [
        'awaiting_payment',
        'payment_submitted',
        'pending_verification',
        'verified',
        'rejected',
        'refund_pending',
        'refunded',
      ],
      default: 'awaiting_payment',
      index: true,
    },
    // Verification
    verification: {
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verificationNotes: String,
      rejectionReason: String,
      adminNotes: String,
    },
    // Refund
    refund: {
      requestedAt: Date,
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      amount: Number,
      processedAt: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      transactionRef: String,
      status: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed'],
        default: 'none',
      },
    },
    // Timestamps
    submittedAt: Date,
    expiresAt: Date, // For payment verification timeout
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ customer: 1, status: 1 });
paymentSchema.index({ lodge: 1, status: 1 });
paymentSchema.index({ 'upi.transactionRef': 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ submittedAt: -1 });

// Virtual for isPendingVerification
paymentSchema.virtual('isPendingVerification').get(function () {
  return this.status === 'pending_verification';
});

// Virtual for canBeVerified
paymentSchema.virtual('canBeVerified').get(function () {
  return ['payment_submitted', 'pending_verification'].includes(this.status);
});

// Pre-save middleware
paymentSchema.pre('save', function (next) {
  // Generate payment ID if not present
  if (!this.paymentId) {
    const prefix = 'PAY';
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.paymentId = `${prefix}${datePart}${randomPart}`;
  }

  // Set submittedAt when status changes to payment_submitted
  if (this.isModified('status') && this.status === 'payment_submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
    // Set verification timeout (24 hours default)
    this.expiresAt = new Date(Date.now() + (process.env.PAYMENT_VERIFICATION_TIMEOUT_HOURS || 24) * 60 * 60 * 1000);
  }

  // Set verifiedAt when status changes to verified
  if (this.isModified('status') && this.status === 'verified' && !this.verification.verifiedAt) {
    this.verification.verifiedAt = new Date();
  }

  next()
});

// Method to submit payment evidence
paymentSchema.methods.submitEvidence = function (screenshotUrl, publicId, transactionRef, upiDetails = {}) {
  this.status = 'payment_submitted';
  this.screenshot = {
    url: screenshotUrl,
    publicId,
    uploadedAt: new Date(),
    ...upiDetails,
  };
  this.upi.transactionRef = transactionRef;
  this.upi.transactionDate = upiDetails.transactionDate || new Date();
  this.upi.payerName = upiDetails.payerName;
  this.upi.payerVPA = upiDetails.payerVPA;
  this.upi.bankReference = upiDetails.bankReference;
  this.submittedAt = new Date();
  this.expiresAt = new Date(Date.now() + (process.env.PAYMENT_VERIFICATION_TIMEOUT_HOURS || 24) * 60 * 60 * 1000);
  this.status = 'pending_verification';
  return this.save();
};

// Method to verify payment (admin action)
paymentSchema.methods.verify = async function (verifiedBy, notes = '') {
  this.status = 'verified';
  this.verification = {
    verifiedAt: new Date(),
    verifiedBy,
    verificationNotes: notes,
    rejectionReason: null,
  };

  // Update booking status to confirmed
  const Booking = mongoose.model('Booking');
  await Booking.findByIdAndUpdate(this.booking, { status: 'confirmed' });

  // Confirm inventory reservation
  const RoomInventory = mongoose.model('RoomInventory');
  const booking = await Booking.findById(this.booking).populate('roomCategory');
  if (booking) {
    await RoomInventory.confirmReservation(
      booking.lodge,
      booking.roomCategory._id,
      booking.checkInDate,
      booking.checkOutDate,
      booking.rooms,
      booking._id,
      'online'
    );
  }

  // Create settlement record
  const Settlement = mongoose.model('Settlement');
  await Settlement.createFromPayment(this);

  return this.save();
};

// Method to reject payment (admin action)
paymentSchema.methods.reject = async function (verifiedBy, reason) {
  this.status = 'rejected';
  this.verification = {
    verifiedAt: new Date(),
    verifiedBy,
    verificationNotes: null,
    rejectionReason: reason,
  };

  // Update booking status to expired (will release inventory)
  const Booking = mongoose.model('Booking');
  const booking = await Booking.findByIdAndUpdate(this.booking, { status: 'expired' });

  // Release inventory reservation
  if (booking) {
    const RoomInventory = mongoose.model('RoomInventory');
    await RoomInventory.releaseReservation(
      booking.lodge,
      booking.roomCategory,
      booking.checkInDate,
      booking.checkOutDate,
      booking.rooms,
      booking._id
    );
  }

  return this.save();
};

// Method to request refund
paymentSchema.methods.requestRefund = async function (requestedBy, reason, amount) {
  this.status = 'refund_pending';
  this.refund = {
    requestedAt: new Date(),
    requestedBy,
    reason,
    amount,
    status: 'pending',
  };
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function (processedBy, transactionRef) {
  this.status = 'refunded';
  this.refund = {
    ...this.refund,
    processedAt: new Date(),
    processedBy,
    transactionRef,
    status: 'processed',
  };
  return this.save();
};

// Static method to check duplicate transaction reference
paymentSchema.statics.isDuplicateTransactionRef = async function (transactionRef) {
  const existing = await this.findOne({
    'upi.transactionRef': transactionRef.toUpperCase().trim(),
    status: { $nin: ['rejected', 'refunded'] },
  });
  return !!existing;
};

// Static method to get pending verifications
paymentSchema.statics.getPendingVerifications = function (filters = {}) {
  const query = { status: 'pending_verification' };
  if (filters.lodge) query.lodge = filters.lodge;
  if (filters.startDate || filters.endDate) {
    query.submittedAt = {};
    if (filters.startDate) query.submittedAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.submittedAt.$lte = new Date(filters.endDate);
  }
  return this.find(query)
    .populate('booking', 'bookingId checkInDate checkOutDate rooms guests')
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name contact')
    .sort({ submittedAt: 1 });
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function (filters = {}) {
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
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

// Static method to cleanup expired pending payments
paymentSchema.statics.cleanupExpired = async function () {
  const expired = await this.find({
    status: 'pending_verification',
    expiresAt: { $lt: new Date() },
  });

  for (const payment of expired) {
    await payment.reject(payment._id, 'Verification timeout - admin did not verify within allowed time');
  }

  return { cleaned: expired.length };
};

module.exports = mongoose.model('Payment', paymentSchema);