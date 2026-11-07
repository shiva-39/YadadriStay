/**
 * Customer Model
 * Discriminator for User with role 'customer'
 */

const mongoose = require('mongoose');
const User = require('./User');

const customerSchema = new mongoose.Schema(
  {
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    emergencyContact: {
      name: String,
      phone: {
        type: String,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
      },
      relationship: String,
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
      },
      language: {
        type: String,
        enum: ['en', 'te'],
        default: 'en',
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    completedStays: {
      type: Number,
      default: 0,
    },
    cancelledBookings: {
      type: Number,
      default: 0,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for upcoming bookings
customerSchema.virtual('upcomingBookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'customer',
  match: { status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] }, checkOutDate: { $gte: new Date() } },
});

// Virtual for booking history
customerSchema.virtual('bookingHistory', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'customer',
  match: { status: { $in: ['completed', 'cancelled', 'refunded'] } },
});

// Method to get customer dashboard stats
customerSchema.methods.getDashboardStats = async function () {
  const Booking = mongoose.model('Booking');
  const stats = await Booking.aggregate([
    { $match: { customer: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
      },
    },
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = { count: curr.count, totalAmount: curr.totalAmount };
    return acc;
  }, {});
};

const Customer = User.discriminator('customer', customerSchema);

module.exports = Customer;