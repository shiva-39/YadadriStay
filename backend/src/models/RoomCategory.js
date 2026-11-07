/**
 * Room Category Model
 * Represents a category of rooms within a lodge
 */

const mongoose = require('mongoose');

const roomCategorySchema = new mongoose.Schema(
  {
    lodge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lodge',
      required: [true, 'Lodge is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Room category name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Capacity
    capacity: {
      adults: {
        type: Number,
        required: [true, 'Adult capacity is required'],
        min: 1,
        max: 10,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      maxOccupancy: {
        type: Number,
        required: [true, 'Maximum occupancy is required'],
        min: 1,
        max: 15,
      },
    },
    // Room Type
    type: {
      type: String,
      enum: ['single', 'double', 'triple', 'quad', 'family', 'dormitory', 'suite', 'deluxe', 'standard'],
      required: [true, 'Room type is required'],
    },
    acType: {
      type: String,
      enum: ['ac', 'non_ac', 'both'],
      required: [true, 'AC type is required'],
    },
    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: 0,
      },
      weekendPrice: {
        type: Number,
        min: 0,
      },
      holidayPrice: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      taxInclusive: {
        type: Boolean,
        default: true,
      },
    },
    // Inventory
    totalRooms: {
      type: Number,
      required: [true, 'Total rooms is required'],
      min: 1,
      max: 100,
    },
    // Room Amenities
    amenities: {
      bedType: {
        type: String,
        enum: ['single', 'double', 'queen', 'king', 'bunk', 'sofa_bed', 'floor_mattress'],
        default: 'double',
      },
      bedCount: { type: Number, default: 1 },
      attachedBathroom: { type: Boolean, default: true },
      hotWater: { type: Boolean, default: true },
      tv: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      fan: { type: Boolean, default: true },
      wardrobe: { type: Boolean, default: true },
      dressingTable: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      window: { type: Boolean, default: true },
      intercom: { type: Boolean, default: false },
      safe: { type: Boolean, default: false },
      miniFridge: { type: Boolean, default: false },
      teaCoffeeMaker: { type: Boolean, default: false },
      other: [String],
    },
    // Media
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        caption: String,
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    videos: [
      {
        url: { type: String, required: true },
        publicId: String,
        caption: String,
        thumbnail: String,
        order: { type: Number, default: 0 },
      },
    ],
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Display Order
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Pricing Rules
    pricingRules: {
      advancePercentage: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      minimumStay: {
        type: Number,
        default: 1,
        min: 1,
      },
      maximumStay: {
        type: Number,
        default: 30,
        min: 1,
      },
      earlyBirdDiscount: {
        enabled: { type: Boolean, default: false },
        daysBefore: { type: Number, default: 7 },
        discountPercentage: { type: Number, default: 10, min: 0, max: 50 },
      },
      lastMinuteDiscount: {
        enabled: { type: Boolean, default: false },
        daysBefore: { type: Number, default: 1 },
        discountPercentage: { type: Number, default: 10, min: 0, max: 50 },
      },
    },
    // Statistics
    stats: {
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageOccupancy: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for current available rooms (for a specific date)
roomCategorySchema.virtual('availableRooms').get(function () {
  // This would be populated from RoomInventory for specific dates
  return this._availableRooms || this.totalRooms;
});

// Virtual for primary image
roomCategorySchema.virtual('primaryImage').get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary ? primary.url : this.images[0]?.url || null;
});

// Pre-save middleware
roomCategorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  // Ensure maxOccupancy >= adults + children
  if (this.capacity.maxOccupancy < this.capacity.adults + this.capacity.children) {
    this.capacity.maxOccupancy = this.capacity.adults + this.capacity.children;
  }
  next();
});

// Method to calculate price for given dates
roomCategorySchema.methods.calculatePrice = function (checkInDate, checkOutDate, guests = {}) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  if (nights <= 0) return { total: 0, nightly: 0, nights: 0, breakdown: [] };

  let totalPrice = 0;
  const breakdown = [];

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkIn);
    currentDate.setDate(currentDate.getDate() + i);

    let nightPrice = this.pricing.basePrice;
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && this.pricing.weekendPrice) {
      nightPrice = this.pricing.weekendPrice;
    }

    // Check for holiday pricing (would need holiday calendar integration)
    // For now, just use base/weekend pricing

    breakdown.push({
      date: currentDate.toISOString().split('T')[0],
      price: nightPrice,
      isWeekend,
    });

    totalPrice += nightPrice;
  }

  // Apply discounts
  let discount = 0;
  if (this.pricingRules.earlyBirdDiscount.enabled) {
    const daysBefore = Math.ceil((checkIn - new Date()) / (1000 * 60 * 60 * 24));
    if (daysBefore >= this.pricingRules.earlyBirdDiscount.daysBefore) {
      discount = Math.max(discount, this.pricingRules.earlyBirdDiscount.discountPercentage);
    }
  }

  if (this.pricingRules.lastMinuteDiscount.enabled) {
    const daysBefore = Math.ceil((checkIn - new Date()) / (1000 * 60 * 60 * 24));
    if (daysBefore <= this.pricingRules.lastMinuteDiscount.daysBefore) {
      discount = Math.max(discount, this.pricingRules.lastMinuteDiscount.discountPercentage);
    }
  }

  const discountAmount = (totalPrice * discount) / 100;
  const finalTotal = totalPrice - discountAmount;

  return {
    total: Math.round(finalTotal),
    nightly: Math.round(finalTotal / nights),
    nights,
    originalTotal: Math.round(totalPrice),
    discount: Math.round(discountAmount),
    discountPercentage: discount,
    breakdown,
  };
};

// Method to get availability for date range
roomCategorySchema.methods.getAvailabilityForRange = async function (checkInDate, checkOutDate) {
  const Inventory = mongoose.model('RoomInventory');
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const dates = [];

  for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  const inventory = await Inventory.find({
    roomCategory: this._id,
    date: { $in: dates },
  });

  const availabilityMap = {};
  inventory.forEach((inv) => {
    const dateStr = inv.date.toISOString().split('T')[0];
    availabilityMap[dateStr] = inv.availableRooms;
  });

  const result = [];
  dates.forEach((date) => {
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      available: availabilityMap[dateStr] ?? this.totalRooms,
      total: this.totalRooms,
    });
  });

  return result;
};

// Static method to get categories with availability
roomCategorySchema.statics.getWithAvailability = async function (lodgeId, checkInDate, checkOutDate, filters = {}) {
  const query = { lodge: lodgeId, isActive: true };

  if (filters.acType) query.acType = filters.acType;
  if (filters.type) query.type = filters.type;
  if (filters.minCapacity) query['capacity.maxOccupancy'] = { $gte: filters.minCapacity };
  if (filters.maxPrice) query['pricing.basePrice'] = { $lte: filters.maxPrice };

  const categories = await this.find(query).sort({ displayOrder: 1, 'pricing.basePrice': 1 });

  const categoriesWithAvailability = await Promise.all(
    categories.map(async (cat) => {
      const availability = await cat.getAvailabilityForRange(checkInDate, checkOutDate);
      const minAvailable = Math.min(...availability.map((a) => a.available));
      const priceInfo = cat.calculatePrice(checkInDate, checkOutDate);

      return {
        ...cat.toObject(),
        availability,
        minAvailable,
        priceInfo,
        canBook: minAvailable > 0,
      };
    })
  );

  return categoriesWithAvailability.filter((c) => c.canBook || !filters.onlyAvailable);
};

// Indexes
roomCategorySchema.index({ lodge: 1, isActive: 1 });
roomCategorySchema.index({ lodge: 1, slug: 1 }, { unique: true });
roomCategorySchema.index({ type: 1, acType: 1 });
roomCategorySchema.index({ 'pricing.basePrice': 1 });

module.exports = mongoose.model('RoomCategory', roomCategorySchema);