/**
 * Transport Request Model
 * Customer requests for transport assistance
 */

const mongoose = require('mongoose');

const transportRequestSchema = new mongoose.Schema(
  {
    // Request Reference
    requestId: {
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    // Request Details
    vehicleType: {
      type: String,
      enum: ['auto', 'car', 'van', 'any'],
      required: [true, 'Vehicle type is required'],
    },
    passengers: {
      type: Number,
      required: [true, 'Number of passengers is required'],
      min: 1,
      max: 20,
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
      maxlength: [500, 'Pickup location cannot exceed 500 characters'],
    },
    pickupCoordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
      maxlength: [500, 'Destination cannot exceed 500 characters'],
    },
    destinationCoordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    },
    preferredDateTime: {
      type: Date,
      required: [true, 'Preferred date and time is required'],
      index: true,
    },
    // Contact
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
    },
    alternatePhone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'contacted', 'arranged', 'completed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    // Admin Management
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin team member
    },
    assignedAt: Date,
    arrangedVehicle: {
      type: String,
      enum: ['auto', 'car', 'van'],
    },
    arrangedProvider: String, // Local transport provider name
    arrangedProviderContact: String,
    arrangedAt: Date,
    // Cost
    estimatedCost: Number,
    actualCost: Number,
    paidByCustomer: { type: Boolean, default: false },
    // Notes
    customerNotes: String,
    adminNotes: String,
    // Communication Log
    communicationLog: [
      {
        type: {
          type: String,
          enum: ['call', 'sms', 'whatsapp', 'in_app'],
        },
        direction: {
          type: String,
          enum: ['inbound', 'outbound'],
        },
        content: String,
        timestamp: { type: Date, default: Date.now },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    // Completion
    completedAt: Date,
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
transportRequestSchema.index({ customer: 1, status: 1 });
transportRequestSchema.index({ status: 1, preferredDateTime: 1 });
transportRequestSchema.index({ assignedTo: 1, status: 1 });
transportRequestSchema.index({ requestId: 1 });

// Pre-save middleware
transportRequestSchema.pre('save', function (next) {
  if (!this.requestId) {
    const prefix = 'TRN';
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.requestId = `${prefix}${datePart}${randomPart}`;
  }
  next();
});

// Method to assign to admin
transportRequestSchema.methods.assign = async function (assignedTo) {
  this.status = 'contacted';
  this.assignedTo = assignedTo;
  this.assignedAt = new Date();
  return this.save();
};

// Method to mark as arranged
transportRequestSchema.methods.arrange = async function (arrangedBy, vehicle, provider, providerContact) {
  this.status = 'arranged';
  this.arrangedVehicle = vehicle;
  this.arrangedProvider = provider;
  this.arrangedProviderContact = providerContact;
  this.arrangedAt = new Date();
  return this.save();
};

// Method to complete
transportRequestSchema.methods.complete = async function (completedBy, actualCost) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (actualCost) this.actualCost = actualCost;
  return this.save();
};

// Method to add communication log
transportRequestSchema.methods.addCommunication = async function (type, direction, content, by) {
  this.communicationLog.push({
    type,
    direction,
    content,
    timestamp: new Date(),
    by,
  });
  return this.save();
};

// Static method to get pending requests
transportRequestSchema.statics.getPending = function (filters = {}) {
  const query = { status: { $in: ['pending', 'contacted'] } };
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.startDate || filters.endDate) {
    query.preferredDateTime = {};
    if (filters.startDate) query.preferredDateTime.$gte = new Date(filters.startDate);
    if (filters.endDate) query.preferredDateTime.$lte = new Date(filters.endDate);
  }
  return this.find(query)
    .populate('customer', 'fullName phone')
    .populate('booking', 'bookingId lodge')
    .populate('assignedTo', 'fullName')
    .sort({ preferredDateTime: 1 });
};

// Static method to get statistics
transportRequestSchema.statics.getStatistics = async function (filters = {}) {
  const matchStage = {};

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
      },
    },
  ]);
};

module.exports = mongoose.model('TransportRequest', transportRequestSchema);