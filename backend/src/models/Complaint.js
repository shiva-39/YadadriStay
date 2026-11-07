/**
 * Complaint Model
 * Customer complaints and support tickets
 */

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    // Complaint Reference
    complaintId: {
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
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    // Category
    category: {
      type: String,
      enum: [
        'booking_issue',
        'payment_issue',
        'refund_request',
        'lodge_complaint',
        'cleanliness',
        'service_quality',
        'amenities',
        'noise_disturbance',
        'safety_security',
        'cancellation',
        'transport',
        'technical',
        'other',
      ],
      required: [true, 'Category is required'],
      index: true,
    },
    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    // Details
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    // Media
    attachments: [
      {
        url: String,
        publicId: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
    // Status
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'reopened'],
      default: 'open',
      index: true,
    },
    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: Date,
    // Resolution
    resolution: {
      summary: String,
      details: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
      actionTaken: String,
    },
    // Communication
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderRole: {
          type: String,
          enum: ['customer', 'admin', 'lodge_owner'],
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        attachments: [
          {
            url: String,
            fileName: String,
          },
        ],
        isInternal: {
          type: Boolean,
          default: false, // Internal notes not visible to customer
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Satisfaction
    satisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String,
      submittedAt: Date,
    },
    // SLA
    sla: {
      responseDueAt: Date,
      resolutionDueAt: Date,
      respondedAt: Date,
      resolvedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
complaintSchema.index({ customer: 1, status: 1 });
complaintSchema.index({ lodge: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ priority: 1, status: 1 });
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ 'sla.responseDueAt': 1 });

// Pre-save middleware
complaintSchema.pre('save', function (next) {
  if (!this.complaintId) {
    const prefix = 'CMP';
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.complaintId = `${prefix}${datePart}${randomPart}`;
  }

  // Set SLA deadlines based on priority
  if (this.isNew) {
    const now = new Date();
    const responseHours = { low: 48, medium: 24, high: 12, urgent: 4 };
    const resolutionHours = { low: 168, medium: 72, high: 48, urgent: 24 };

    this.sla.responseDueAt = new Date(now.getTime() + responseHours[this.priority] * 60 * 60 * 1000);
    this.sla.resolutionDueAt = new Date(now.getTime() + resolutionHours[this.priority] * 60 * 60 * 1000);
  }

  next();
});

// Method to add message
complaintSchema.methods.addMessage = async function (sender, senderRole, message, attachments = [], isInternal = false) {
  this.messages.push({
    sender,
    senderRole,
    message,
    attachments,
    isInternal,
    createdAt: new Date(),
  });

  // Update status if first response from admin
  if (senderRole === 'admin' && this.status === 'open') {
    this.status = 'in_progress';
    this.sla.respondedAt = new Date();
  }

  // Update status if customer responds to waiting_customer
  if (senderRole === 'customer' && this.status === 'waiting_customer') {
    this.status = 'in_progress';
  }

  return this.save();
};

// Method to assign
complaintSchema.methods.assign = async function (assignedTo) {
  this.assignedTo = assignedTo;
  this.assignedAt = new Date();
  if (this.status === 'open') this.status = 'in_progress';
  return this.save();
};

// Method to resolve
complaintSchema.methods.resolve = async function (resolvedBy, summary, details, actionTaken) {
  this.status = 'resolved';
  this.resolution = {
    summary,
    details,
    resolvedBy,
    resolvedAt: new Date(),
    actionTaken,
  };
  this.sla.resolvedAt = new Date();
  return this.save();
};

// Method to close
complaintSchema.methods.close = async function () {
  this.status = 'closed';
  return this.save();
};

// Method to reopen
complaintSchema.methods.reopen = async function (reason) {
  this.status = 'reopened';
  this.resolution = undefined;
  this.sla.resolvedAt = undefined;
  await this.addMessage(null, 'admin', `Reopened: ${reason}`, [], true);
  return this.save();
};

// Method to add satisfaction rating
complaintSchema.methods.addSatisfaction = async function (rating, feedback) {
  this.satisfaction = {
    rating,
    feedback,
    submittedAt: new Date(),
  };
  return this.save();
};

// Static method to get open complaints
complaintSchema.statics.getOpen = function (filters = {}) {
  const query = { status: { $in: ['open', 'in_progress', 'waiting_customer', 'reopened'] } };
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  if (filters.lodge) query.lodge = filters.lodge;
  return this.find(query)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .sort({ priority: -1, createdAt: 1 });
};

// Static method to get statistics
complaintSchema.statics.getStatistics = async function (filters = {}) {
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
        avgResolutionTime: { $avg: { $subtract: ['$sla.resolvedAt', '$createdAt'] } },
      },
    },
  ]);
};

module.exports = mongoose.model('Complaint', complaintSchema);