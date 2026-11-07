/**
 * Admin Settings Model
 * Platform-wide configuration settings
 */

const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema(
  {
    // Settings are stored as key-value pairs
    // Only one document should exist (singleton pattern)
    _id: {
      type: String,
      default: 'global_settings',
    },

    // Platform UPI Configuration
    upi: {
      vpa: {
        type: String,
        default: '',
        trim: true,
      },
      qrCodeUrl: {
        type: String,
        default: '',
      },
      qrCodePublicId: String,
      businessName: {
        type: String,
        default: 'Yadadri Stay',
      },
    },

    // Default Payment Settings
    payments: {
      defaultAdvancePercentage: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      verificationTimeoutHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 168,
      },
      allowPartialPayment: {
        type: Boolean,
        default: false,
      },
      refundPolicy: {
        type: String,
        enum: ['no_refund', 'partial_refund', 'full_refund', 'custom'],
        default: 'no_refund',
      },
      customRefundPolicy: String,
    },

    // Default Check-in/Check-out Times
    timings: {
      defaultCheckInTime: {
        type: String,
        default: '12:00',
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
      },
      defaultCheckOutTime: {
        type: String,
        default: '11:00',
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
      },
      allowEarlyCheckIn: { type: Boolean, default: false },
      allowLateCheckOut: { type: Boolean, default: false },
      earlyCheckInCharge: { type: Number, default: 0 },
      lateCheckOutCharge: { type: Number, default: 0 },
    },

    // Booking Rules
    booking: {
      maxAdvanceBookingDays: {
        type: Number,
        default: 90,
        min: 1,
        max: 365,
      },
      minAdvanceBookingHours: {
        type: Number,
        default: 2,
        min: 0,
        max: 168,
      },
      maxStayDuration: {
        type: Number,
        default: 30,
        min: 1,
        max: 90,
      },
      minStayDuration: {
        type: Number,
        default: 1,
        min: 1,
      },
      allowSameDayBooking: { type: Boolean, default: true },
      inventoryLockMinutes: {
        type: Number,
        default: 10,
        min: 5,
        max: 60,
      },
      autoCancelPendingHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 168,
      },
    },

    // Cancellation Policy
    cancellation: {
      defaultPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict', 'custom'],
        default: 'moderate',
      },
      customPolicy: String,
      freeCancellationHours: {
        type: Number,
        default: 24,
        min: 0,
        max: 720,
      },
      adminCanOverride: { type: Boolean, default: true },
    },

    // Commission & Fees
    commissions: {
      platformCommissionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 50,
      },
      gstOnCommission: {
        type: Number,
        default: 18,
        min: 0,
        max: 100,
      },
      settlementCycles: {
        type: [String],
        enum: ['weekly', 'biweekly', 'monthly'],
        default: ['monthly'],
      },
      defaultSettlementCycle: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly'],
        default: 'monthly',
      },
    },

    // Lodge Approval
    lodgeApproval: {
      autoApprove: { type: Boolean, default: false },
      requiredDocuments: {
        type: [String],
        default: ['gstCertificate', 'panCard', 'aadhaarCard', 'bankPassbook', 'ownershipProof'],
      },
      maxImages: { type: Number, default: 20, min: 1, max: 50 },
      maxVideos: { type: Number, default: 5, min: 0, max: 20 },
      maxFileSizeMB: { type: Number, default: 10, min: 1, max: 50 },
    },

    // Reviews
    reviews: {
      requireCompletedStay: { type: Boolean, default: true },
      allowOwnerResponse: { type: Boolean, default: true },
      moderationRequired: { type: Boolean, default: true },
      maxImagesPerReview: { type: Number, default: 5, min: 0, max: 20 },
    },

    // Notifications
    notifications: {
      enablePush: { type: Boolean, default: false },
      enableEmail: { type: Boolean, default: false },
      enableSMS: { type: Boolean, default: false },
      enableWhatsApp: { type: Boolean, default: false },
      bookingConfirmationTemplate: String,
      paymentReminderTemplate: String,
      checkInReminderTemplate: String,
    },

    // Security
    security: {
      maxLoginAttempts: { type: Number, default: 5, min: 3, max: 10 },
      lockoutDurationMinutes: { type: Number, default: 30, min: 5, max: 1440 },
      passwordMinLength: { type: Number, default: 8, min: 6, max: 32 },
      requireEmailVerification: { type: Boolean, default: false },
      requirePhoneVerification: { type: Boolean, default: false },
      sessionTimeoutHours: { type: Number, default: 168, min: 1, max: 8760 }, // 7 days
      jwtExpiryDays: { type: Number, default: 7, min: 1, max: 90 },
      refreshTokenExpiryDays: { type: Number, default: 30, min: 1, max: 365 },
    },

    // Rate Limiting
    rateLimiting: {
      apiRequestsPerWindow: { type: Number, default: 100, min: 10, max: 1000 },
      apiWindowMinutes: { type: Number, default: 15, min: 1, max: 60 },
      authRequestsPerWindow: { type: Number, default: 10, min: 3, max: 50 },
      authWindowMinutes: { type: Number, default: 15, min: 5, max: 60 },
    },

    // File Upload
    upload: {
      maxFileSizeMB: { type: Number, default: 10, min: 1, max: 100 },
      allowedImageTypes: {
        type: [String],
        default: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      },
      allowedVideoTypes: {
        type: [String],
        default: ['video/mp4', 'video/webm', 'video/quicktime'],
      },
      allowedDocumentTypes: {
        type: [String],
        default: ['application/pdf', 'image/jpeg', 'image/png'],
      },
    },

    // Temple Location (for distance calculations)
    temple: {
      name: {
        type: String,
        default: 'Yadadri Lakshmi Narasimha Swamy Temple',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [78.9417, 17.0833], // Approximate coordinates for Yadadri
      },
      address: {
        type: String,
        default: 'Yadadri, Bhuvanagiri District, Telangana 508116, India',
      },
    },

    // Feature Flags
    features: {
      enableReviews: { type: Boolean, default: true },
      enableTransport: { type: Boolean, default: true },
      enableComplaints: { type: Boolean, default: true },
      enableOfflineBooking: { type: Boolean, default: true },
      enableLodgeRegistration: { type: Boolean, default: true },
      enableCustomerRegistration: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: String,
    },

    // Contact & Support
    contact: {
      supportPhone: { type: String, default: '' },
      supportEmail: { type: String, default: '' },
      supportWhatsApp: { type: String, default: '' },
      officeAddress: String,
      officeHours: String,
    },

    // Social & Legal
    legal: {
      termsOfServiceUrl: String,
      privacyPolicyUrl: String,
      refundPolicyUrl: String,
      cancellationPolicyUrl: String,
    },

    // Audit
    updatedBy: {
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

// Static method to get settings (singleton)
adminSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('global_settings');
  if (!settings) {
    settings = await this.create({ _id: 'global_settings' });
  }
  return settings;
};

// Static method to update settings
adminSettingsSchema.statics.updateSettings = async function (updates, updatedBy) {
  const settings = await this.getSettings();

  // Deep merge updates
  const mergeDeep = (target, source) => {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  };

  mergeDeep(settings, updates);
  settings.updatedBy = updatedBy;
  return settings.save();
};

// Static method to get specific section
adminSettingsSchema.statics.getSection = async function (section) {
  const settings = await this.getSettings();
  return settings[section] || {};
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);