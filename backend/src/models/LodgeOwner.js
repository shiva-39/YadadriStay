/**
 * Lodge Owner Model
 * Discriminator for User with role 'lodge_owner'
 */

const mongoose = require('mongoose');
const User = require('./User');

const lodgeOwnerSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format'],
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format'],
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: {
        type: String,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'],
      },
      bankName: String,
      branchName: String,
    },
    upiId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    documents: {
      gstCertificate: String,
      panCard: String,
      aadhaarCard: String,
      bankPassbook: String,
      ownershipProof: String,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    verificationNotes: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    settlementCycle: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },
    lastSettlementDate: {
      type: Date,
    },
    pendingSettlementAmount: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for owned lodges
lodgeOwnerSchema.virtual('lodges', {
  ref: 'Lodge',
  localField: '_id',
  foreignField: 'owner',
});

// Method to get owner dashboard stats
lodgeOwnerSchema.methods.getDashboardStats = async function () {
  const Lodge = mongoose.model('Lodge');
  const Booking = mongoose.model('Booking');
  const OfflineBooking = mongoose.model('OfflineBooking');
  const Payment = mongoose.model('Payment');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get lodges count
  const lodges = await Lodge.find({ owner: this._id, isActive: true });

  // Get today's arrivals
  const arrivals = await Booking.countDocuments({
    lodge: { $in: lodges.map((l) => l._id) },
    checkInDate: { $gte: today, $lt: tomorrow },
    status: 'confirmed',
  });

  // Get upcoming reservations (next 7 days)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcoming = await Booking.countDocuments({
    lodge: { $in: lodges.map((l) => l._id) },
    checkInDate: { $gte: today, $lt: nextWeek },
    status: 'confirmed',
  });

  // Get available rooms
  const RoomCategory = mongoose.model('RoomCategory');
  const Inventory = mongoose.model('RoomInventory');

  const roomCategories = await RoomCategory.find({ lodge: { $in: lodges.map((l) => l._id) }, isActive: true });
  let availableRooms = 0;
  let occupiedRooms = 0;

  for (const category of roomCategories) {
    const inventory = await Inventory.find({
      lodge: category.lodge,
      roomCategory: category._id,
      date: { $gte: today, $lt: tomorrow },
    });
    for (const inv of inventory) {
      availableRooms += inv.availableRooms;
      occupiedRooms += inv.totalRooms - inv.availableRooms;
    }
  }

  // Pending payment verification
  const pendingVerification = await Payment.countDocuments({
    lodge: { $in: lodges.map((l) => l._id) },
    status: 'pending_verification',
  });

  // Online/Offline booking counts
  const onlineBookings = await Booking.countDocuments({
    lodge: { $in: lodges.map((l) => l._id) },
    status: { $in: ['confirmed', 'pending_payment', 'pending_verification'] },
  });

  const offlineBookings = await OfflineBooking.countDocuments({
    lodge: { $in: lodges.map((l) => l._id) },
    status: 'confirmed',
  });

  return {
    totalRoomCategories: roomCategories.length,
    totalRooms: roomCategories.reduce((sum, c) => sum + c.totalRooms, 0),
    todaysArrivals: arrivals,
    upcomingReservations: upcoming,
    availableRooms,
    occupiedRooms,
    pendingPaymentVerification: pendingVerification,
    onlineBookingCount: onlineBookings,
    offlineBookingCount: offlineBookings,
    pendingSettlementAmount: this.pendingSettlementAmount,
    totalRevenue: this.totalRevenue,
  };
};

const LodgeOwner = User.discriminator('lodge_owner', lodgeOwnerSchema);

module.exports = LodgeOwner;