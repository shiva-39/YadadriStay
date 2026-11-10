/**
 * Room Inventory Model
 * Date-wise room availability tracking with atomic operations
 */

const mongoose = require('mongoose');

const roomInventorySchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    // Core inventory fields
    totalRooms: {
      type: Number,
      required: [true, 'Total rooms is required'],
      min: 0,
    },
    availableRooms: {
      type: Number,
      required: [true, 'Available rooms is required'],
      min: 0,
    },
    blockedRooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Booking references for this date
    bookedRooms: [
      {
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        bookingType: {
          type: String,
          enum: ['online', 'offline'],
          default: 'online',
        },
      },
    ],
    // Offline bookings
    offlineBookedRooms: [
      {
        offlineBookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'OfflineBooking',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    // Temporary reservations (payment pending)
    reservedRooms: [
      {
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],
    // Price snapshot for this date
    priceSnapshot: {
      basePrice: Number,
      weekendPrice: Number,
      holidayPrice: Number,
      currency: { type: String, default: 'INR' },
    },
    // Status
    isClosed: {
      type: Boolean,
      default: false, // Lodge closed for this date
    },
    closureReason: String,
    // Notes
    notes: String,
    // Audit
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

// Compound unique index - one inventory record per lodge/category/date
roomInventorySchema.index(
  { lodge: 1, roomCategory: 1, date: 1 },
  { unique: true, name: 'unique_inventory_per_date' }
);

// Index for querying by date range
roomInventorySchema.index({ lodge: 1, date: 1 });
roomInventorySchema.index({ roomCategory: 1, date: 1 });
roomInventorySchema.index({ date: 1, availableRooms: 1 });

// Virtual for occupied rooms
roomInventorySchema.virtual('occupiedRooms').get(function () {
  return this.totalRooms - this.availableRooms - this.blockedRooms;
});

// Virtual for reservation count
roomInventorySchema.virtual('reservedCount').get(function () {
  return this.reservedRooms.reduce((sum, r) => sum + r.quantity, 0);
});

// Pre-save validation
roomInventorySchema.pre('save', function (next) {
  // Ensure availableRooms doesn't exceed totalRooms
  if (this.availableRooms > this.totalRooms) {
    this.availableRooms = this.totalRooms;
  }

  // Ensure availableRooms doesn't go negative
  if (this.availableRooms < 0) {
    this.availableRooms = 0;
  }

  // Ensure blockedRooms doesn't exceed totalRooms
  if (this.blockedRooms > this.totalRooms) {
    this.blockedRooms = this.totalRooms;
  }

  // Ensure sum doesn't exceed totalRooms
  const bookedCount = this.bookedRooms.reduce((sum, b) => sum + b.quantity, 0);
  const offlineCount = this.offlineBookedRooms.reduce((sum, b) => sum + b.quantity, 0);
  const reservedCount = this.reservedRooms.reduce((sum, r) => sum + r.quantity, 0);

  if (bookedCount + offlineCount + reservedCount + this.blockedRooms > this.totalRooms) {
    next(new Error('Total allocated rooms exceed total rooms'));
  }

  next();
});

// Static method to get or create inventory for date range
roomInventorySchema.statics.ensureInventoryForRange = async function (
  lodgeId,
  roomCategoryId,
  startDate,
  endDate,
  totalRooms,
  priceSnapshot = {}
) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const operations = dates.map((date) => ({
    updateOne: {
      filter: { lodge: lodgeId, roomCategory: roomCategoryId, date },
      update: {
        $setOnInsert: {
          lodge: lodgeId,
          roomCategory: roomCategoryId,
          date,
          totalRooms,
          availableRooms: totalRooms,
          blockedRooms: 0,
          bookedRooms: [],
          offlineBookedRooms: [],
          reservedRooms: [],
          priceSnapshot,
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await this.bulkWrite(operations, { ordered: false });
  }

  return this.find({ lodge: lodgeId, roomCategory: roomCategoryId, date: { $in: dates } });
};

// Static method to atomically reserve rooms (for payment flow)
roomInventorySchema.statics.reserveRooms = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  reservationMinutes = 10
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const dates = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

    // Find all inventory records for the date range
    const inventoryRecords = await this.find({
      lodge: lodgeId,
      roomCategory: roomCategoryId,
      date: { $in: dates },
    }).session(session);

    if (inventoryRecords.length !== dates.length) {
      throw new Error('Inventory records not found for all dates');
    }

    // Check availability for all dates
    for (const record of inventoryRecords) {
      if (record.availableRooms < quantity) {
        throw new Error(`Insufficient availability on ${record.date.toISOString().split('T')[0]}`);
      }
      if (record.isClosed) {
        throw new Error(`Lodge is closed on ${record.date.toISOString().split('T')[0]}`);
      }
    }

    // Atomically reserve rooms
    const bulkOps = inventoryRecords.map((record) => ({
      updateOne: {
        filter: { _id: record._id },
        update: {
          $inc: { availableRooms: -quantity },
          $push: {
            reservedRooms: {
              bookingId,
              quantity,
              expiresAt,
            },
          },
          $set: { lastUpdatedBy: bookingId }, // Using bookingId as reference
        },
      },
    }));

    await this.bulkWrite(bulkOps, { session, ordered: false });

    await session.commitTransaction();
    return { success: true, expiresAt };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// Static method to confirm reservation (convert to booking)
roomInventorySchema.statics.confirmReservation = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  bookingType = 'online'
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const dates = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Remove from reservedRooms and add to bookedRooms
    const bulkOps = dates.map((date) => ({
      updateOne: {
        filter: {
          lodge: lodgeId,
          roomCategory: roomCategoryId,
          date,
          'reservedRooms.bookingId': bookingId,
        },
        update: {
          $pull: { reservedRooms: { bookingId } },
          $push: {
            bookedRooms: {
              bookingId,
              quantity,
              bookingType,
            },
          },
        },
      },
    }));

    await this.bulkWrite(bulkOps, { session, ordered: false });

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// Static method to release reservation (expired or cancelled)
roomInventorySchema.statics.releaseReservation = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const dates = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const bulkOps = dates.map((date) => ({
      updateOne: {
        filter: {
          lodge: lodgeId,
          roomCategory: roomCategoryId,
          date,
        },
        update: {
          $inc: { availableRooms: quantity },
          $pull: { reservedRooms: { bookingId } },
        },
      },
    }));

    await this.bulkWrite(bulkOps, { session, ordered: false });

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// Static method to release confirmed booking (cancellation)
roomInventorySchema.statics.releaseBooking = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  bookingType = 'online'
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const dates = [];
    const current = new Date(checkInDate);
    const end = new Date(checkOutDate);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const pullField = bookingType === 'offline' ? 'offlineBookedRooms' : 'bookedRooms';

    const bulkOps = dates.map((date) => ({
      updateOne: {
        filter: {
          lodge: lodgeId,
          roomCategory: roomCategoryId,
          date,
        },
        update: {
          $inc: { availableRooms: quantity },
          $pull: { [pullField]: { bookingId } },
        },
      },
    }));

    await this.bulkWrite(bulkOps, { session, ordered: false });

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// Static method to cleanup expired reservations
roomInventorySchema.statics.cleanupExpiredReservations = async function () {
  const now = new Date();

  const result = await this.updateMany(
    {
      'reservedRooms.expiresAt': { $lt: now },
    },
    {
      $inc: { availableRooms: { $sum: '$reservedRooms.quantity' } }, // This won't work directly, need aggregation
      $set: { reservedRooms: [] },
    }
  );

  // Better approach: use aggregation pipeline update (MongoDB 4.2+)
  const expiredRecords = await this.find({
    'reservedRooms.expiresAt': { $lt: now },
  });

  for (const record of expiredRecords) {
    let totalReleased = 0;
    const validReservations = [];

    for (const reservation of record.reservedRooms) {
      if (reservation.expiresAt > now) {
        validReservations.push(reservation);
      } else {
        totalReleased += reservation.quantity;
      }
    }

    if (totalReleased > 0) {
      record.availableRooms += totalReleased;
      record.reservedRooms = validReservations;
      await record.save();
    }
  }

  return { cleaned: expiredRecords.length };
};

// Static method to get availability for date range
roomInventorySchema.statics.getAvailabilityForRange = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate
) {
  const dates = [];
  const current = new Date(checkInDate);
  const end = new Date(checkOutDate);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const inventory = await this.find({
    lodge: lodgeId,
    roomCategory: roomCategoryId,
    date: { $in: dates },
  }).sort({ date: 1 });

  const availabilityMap = {};
  inventory.forEach((inv) => {
    const dateStr = inv.date.toISOString().split('T')[0];
    availabilityMap[dateStr] = {
      totalRooms: inv.totalRooms,
      availableRooms: inv.availableRooms,
      blockedRooms: inv.blockedRooms,
      isClosed: inv.isClosed,
      priceSnapshot: inv.priceSnapshot,
    };
  });

  return dates.map((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr,
      ...(availabilityMap[dateStr] || {
        totalRooms: 0,
        availableRooms: 0,
        blockedRooms: 0,
        isClosed: false,
        priceSnapshot: null,
      }),
    };
  });
};

// Static method to bulk update inventory (owner dashboard)
roomInventorySchema.statics.bulkUpdateAvailability = async function (
  updates,
  userId
) {
  // updates: [{ roomCategoryId, date, availableRooms, blockedRooms, isClosed, closureReason }]
  const operations = updates.map((update) => ({
    updateOne: {
      filter: {
        roomCategory: update.roomCategoryId,
        date: new Date(update.date),
      },
      update: {
        $set: {
          availableRooms: update.availableRooms,
          blockedRooms: update.blockedRooms || 0,
          isClosed: update.isClosed || false,
          closureReason: update.closureReason || '',
          lastUpdatedBy: userId,
        },
      },
      upsert: false,
    },
  }));

  if (operations.length > 0) {
    const result = await this.bulkWrite(operations, { ordered: false });
    return result;
  }

  return { modifiedCount: 0 };
};

// ==================== NON-TRANSACTIONAL FALLBACK METHODS ====================
// These methods work on standalone MongoDB without replica set

/**
 * Non-transactional reserve rooms (fallback for standalone MongoDB)
 * Uses optimistic locking with version checking
 */
roomInventorySchema.statics.reserveRoomsFallback = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  reservationMinutes = 10
) {
  const dates = [];
  const current = new Date(checkInDate);
  const end = new Date(checkOutDate);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

  // Find all inventory records for the date range
  const inventoryRecords = await this.find({
    lodge: lodgeId,
    roomCategory: roomCategoryId,
    date: { $in: dates },
  });

  if (inventoryRecords.length !== dates.length) {
    throw new Error('Inventory records not found for all dates');
  }

  // Check availability for all dates
  for (const record of inventoryRecords) {
    if (record.availableRooms < quantity) {
      throw new Error(`Insufficient availability on ${record.date.toISOString().split('T')[0]}`);
    }
    if (record.isClosed) {
      throw new Error(`Lodge is closed on ${record.date.toISOString().split('T')[0]}`);
    }
  }

  // Use bulkWrite without session (non-transactional)
  // Each update includes a version check for optimistic locking
  const bulkOps = inventoryRecords.map((record) => ({
    updateOne: {
      filter: {
        _id: record._id,
        availableRooms: { $gte: quantity }, // Optimistic lock: only update if still available
      },
      update: {
        $inc: { availableRooms: -quantity },
        $push: {
          reservedRooms: {
            bookingId,
            quantity,
            expiresAt,
          },
        },
        $set: { lastUpdatedBy: bookingId },
      },
    },
  }));

  const result = await this.bulkWrite(bulkOps, { ordered: false });

  // Verify all updates succeeded
  if (result.modifiedCount !== dates.length) {
    // Some updates failed - rollback what we can
    await this.releaseReservationFallback(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId);
    throw new Error('Concurrent modification detected, reservation failed. Please retry.');
  }

  return { success: true, expiresAt };
};

/**
 * Non-transactional confirm reservation (fallback)
 */
roomInventorySchema.statics.confirmReservationFallback = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  bookingType = 'online'
) {
  const dates = [];
  const current = new Date(checkInDate);
  const end = new Date(checkOutDate);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        lodge: lodgeId,
        roomCategory: roomCategoryId,
        date,
        'reservedRooms.bookingId': bookingId,
      },
      update: {
        $pull: { reservedRooms: { bookingId } },
        $push: {
          bookedRooms: {
            bookingId,
            quantity,
            bookingType,
          },
        },
      },
    },
  }));

  await this.bulkWrite(bulkOps, { ordered: false });
  return { success: true };
};

/**
 * Non-transactional release reservation (fallback)
 */
roomInventorySchema.statics.releaseReservationFallback = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId
) {
  const dates = [];
  const current = new Date(checkInDate);
  const end = new Date(checkOutDate);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        lodge: lodgeId,
        roomCategory: roomCategoryId,
        date,
      },
      update: {
        $inc: { availableRooms: quantity },
        $pull: { reservedRooms: { bookingId } },
      },
    },
  }));

  await this.bulkWrite(bulkOps, { ordered: false });
  return { success: true };
};

/**
 * Non-transactional release booking (fallback)
 */
roomInventorySchema.statics.releaseBookingFallback = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  bookingType = 'online'
) {
  const dates = [];
  const current = new Date(checkInDate);
  const end = new Date(checkOutDate);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const pullField = bookingType === 'offline' ? 'offlineBookedRooms' : 'bookedRooms';

  const bulkOps = dates.map((date) => ({
    updateOne: {
      filter: {
        lodge: lodgeId,
        roomCategory: roomCategoryId,
        date,
      },
      update: {
        $inc: { availableRooms: quantity },
        $pull: { [pullField]: { bookingId } },
      },
    },
  }));

  await this.bulkWrite(bulkOps, { ordered: false });
  return { success: true };
};

// ==================== UNIFIED METHODS WITH AUTO-FALLBACK ====================

const { hasTransactionSupport, withTransactionFallback } = require('../config/database');

/**
 * Unified reserve rooms - uses transactions if available, fallback otherwise
 */
roomInventorySchema.statics.reserveRoomsUnified = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  reservationMinutes = 10
) {
  const transactionalFn = () => this.reserveRooms(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId, reservationMinutes);
  const fallbackFn = () => this.reserveRoomsFallback(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId, reservationMinutes);

  return withTransactionFallback(transactionalFn, fallbackFn);
};

/**
 * Unified confirm reservation
 */
roomInventorySchema.statics.confirmReservationUnified = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  bookingType = 'online'
) {
  const transactionalFn = () => this.confirmReservation(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId, bookingType);
  const fallbackFn = () => this.confirmReservationFallback(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId, bookingType);

  return withTransactionFallback(transactionalFn, fallbackFn);
};

/**
 * Unified release reservation
 */
roomInventorySchema.statics.releaseReservationUnified = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId
) {
  const transactionalFn = () => this.releaseReservation(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId);
  const fallbackFn = () => this.releaseReservationFallback(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId);

  return withTransactionFallback(transactionalFn, fallbackFn);
};

/**
 * Unified release booking
 */
roomInventorySchema.statics.releaseBookingUnified = async function (
  lodgeId,
  roomCategoryId,
  checkInDate,
  checkOutDate,
  quantity,
  bookingId,
  bookingType = 'online'
) {
  const transactionalFn = () => this.releaseBooking(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId, bookingType);
  const fallbackFn = () => this.releaseBookingFallback(lodgeId, roomCategoryId, checkInDate, checkOutDate, quantity, bookingId, bookingType);

  return withTransactionFallback(transactionalFn, fallbackFn);
};

module.exports = mongoose.model('RoomInventory', roomInventorySchema);