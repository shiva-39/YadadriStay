/**
 * Seed Script for Yadadri Stay
 * Creates test data including super admin, lodge owner, temple lodges, room categories, and inventory
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/database');

// Import models
const User = require('../models/User');
const LodgeOwner = require('../models/LodgeOwner');
const SuperAdmin = require('../models/SuperAdmin'); // Register discriminator
const Lodge = require('../models/Lodge');
const RoomCategory = require('../models/RoomCategory');
const RoomInventory = require('../models/RoomInventory');
const Customer = require('../models/Customer');

// Temple coordinates for Yadadri (approximate)
const TEMPLE_COORDINATES = [78.9425, 17.5868]; // [longitude, latitude]

// Helper function to calculate distance from temple
function calculateDistanceFromTemple(coords) {
  const [lon1, lat1] = coords;
  const [lon2, lat2] = TEMPLE_COORDINATES;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

// Generate dates for the next 90 days
function generateDateRange(days = 90) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

// Password hashing helper
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function seedSuperAdmin() {
  console.log('\n🌱 Seeding Super Admin...');

  const existingAdmin = await User.findOne({
    phone: process.env.SUPER_ADMIN_PHONE || '9876543210',
    role: 'super_admin',
  });

  if (existingAdmin) {
    console.log('✅ Super Admin already exists');
    return existingAdmin;
  }

  const admin = await User.create({
    phone: process.env.SUPER_ADMIN_PHONE || '9876543210',
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@yadadristay.com',
    password: await hashPassword(process.env.SUPER_ADMIN_PASSWORD || 'SecureAdminPass123!'),
    fullName: 'Yadadri Stay Super Admin',
    role: 'super_admin',
    isVerified: true,
    isActive: true,
    language: 'en',
  });

  console.log('✅ Super Admin created:', admin.phone);
  return admin;
}

async function seedLodgeOwner() {
  console.log('\n🌱 Seeding Lodge Owner...');

  const existingOwner = await User.findOne({
    phone: '9988776655',
    role: 'lodge_owner',
  });

  if (existingOwner) {
    console.log('✅ Lodge Owner already exists');
    return existingOwner;
  }

  const owner = await User.create({
    phone: '9988776655',
    email: 'owner@yadadristay.com',
    password: await hashPassword('OwnerPass123!'),
    fullName: 'Rajesh Kumar',
    role: 'lodge_owner',
    isVerified: true,
    isActive: true,
    language: 'te',
    // LodgeOwner specific fields
    businessName: 'Sri Venkateswara Lodges',
    gstNumber: '36AAACA1234A1Z5',
    panNumber: 'ABCDE1234F',
    bankDetails: {
      accountHolderName: 'Rajesh Kumar',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      branchName: 'Yadagirigutta Branch',
    },
    upiId: 'rajeshkumar@upi',
    verificationStatus: 'approved',
    verifiedBy: null, // Will be set after admin creation
    verifiedAt: new Date(),
    commissionRate: 10,
    settlementCycle: 'monthly',
    isActive: true,
  });

  console.log('✅ Lodge Owner created:', owner.phone);
  return owner;
}

async function seedLodges(owner) {
  console.log('\n🌱 Seeding Temple Lodges...');

  const existingLodge = await Lodge.findOne({ owner: owner._id });

  if (existingLodge) {
    console.log('✅ Lodges already exist');
    return await Lodge.find({ owner: owner._id });
  }

  const lodgesData = [
    {
      name: 'Sri Lakshmi Narasimha Nilayam',
      description:
        'A serene and comfortable lodge located just 500 meters from the sacred Yadadri Lakshmi Narasimha Swamy Temple. Offers clean, well-maintained rooms with modern amenities for pilgrims and tourists.',
      shortDescription:
        'Premium lodge near Yadadri Temple with AC/Non-AC rooms, restaurant, and 24/7 service.',
      address: {
        street: 'Temple Road, Near Yadadri Bus Stand',
        city: 'Yadagirigutta',
        state: 'Telangana',
        pincode: '508115',
        coordinates: [78.9402, 17.5875],
        landmark: 'Opposite Yadadri Temple Main Gate',
        distanceFromTemple: 0.5,
      },
      contact: {
        phone: '9988776655',
        alternatePhone: '8899776655',
        email: 'lakshminarasimha@yadadristay.com',
        whatsappNumber: '9988776655',
      },
      facilities: {
        parking: true,
        wifi: true,
        ac: true,
        nonAc: true,
        restaurant: true,
        roomService: true,
        laundry: true,
        pickupDrop: true,
        hotWater: true,
        powerBackup: true,
        security: true,
        cctv: true,
        lift: true,
        other: ['Temple view rooms', 'Prayer hall', 'Vegetarian restaurant'],
      },
      policies: {
        checkInTime: '12:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'moderate',
        advancePaymentPercentage: 20,
        allowPets: false,
        allowSmoking: false,
        allowUnmarriedCouples: true,
        minAge: 18,
      },
      pricing: {
        basePrice: 1500,
        currency: 'INR',
        taxPercentage: 18,
        serviceChargePercentage: 5,
      },
      status: 'approved',
      isFeatured: true,
      priority: 10,
      publishedAt: new Date(),
    },
    {
      name: 'Sri Anjaneya Swamy Lodge',
      description:
        'Budget-friendly accommodation with clean rooms and basic amenities. Located within walking distance of the temple, ideal for devotees seeking affordable stay.',
      shortDescription:
        'Budget lodge near temple with clean rooms, hot water, and vegetarian food.',
      address: {
        street: 'Hanuman Temple Street, Yadagirigutta',
        city: 'Yadagirigutta',
        state: 'Telangana',
        pincode: '508115',
        coordinates: [78.9435, 17.5855],
        landmark: 'Near Hanuman Temple, 300m from Main Temple',
        distanceFromTemple: 0.3,
      },
      contact: {
        phone: '9988776655',
        alternatePhone: '8899776655',
        email: 'anjaneya@yadadristay.com',
        whatsappNumber: '9988776655',
      },
      facilities: {
        parking: true,
        wifi: false,
        ac: false,
        nonAc: true,
        restaurant: true,
        roomService: false,
        laundry: true,
        pickupDrop: false,
        hotWater: true,
        powerBackup: true,
        security: true,
        cctv: true,
        lift: false,
        other: ['Prayer area', 'Free temple prasadam'],
      },
      policies: {
        checkInTime: '12:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'flexible',
        advancePaymentPercentage: 10,
        allowPets: false,
        allowSmoking: false,
        allowUnmarriedCouples: true,
        minAge: 18,
      },
      pricing: {
        basePrice: 800,
        currency: 'INR',
        taxPercentage: 18,
        serviceChargePercentage: 0,
      },
      status: 'approved',
      isFeatured: false,
      priority: 5,
      publishedAt: new Date(),
    },
    {
      name: 'Divya Darshan Residency',
      description:
        'Premium residency offering deluxe rooms with temple view, modern amenities, and exceptional service. Perfect for families and VIP devotees visiting the temple.',
      shortDescription:
        'Luxury residency with temple view rooms, premium amenities, and fine dining.',
      address: {
        street: 'Hill Top Road, Yadagirigutta',
        city: 'Yadagirigutta',
        state: 'Telangana',
        pincode: '508115',
        coordinates: [78.9385, 17.5892],
        landmark: 'Hilltop, 800m from Temple, Panoramic View',
        distanceFromTemple: 0.8,
      },
      contact: {
        phone: '9988776655',
        alternatePhone: '8899776655',
        email: 'divyadarshan@yadadristay.com',
        whatsappNumber: '9988776655',
      },
      facilities: {
        parking: true,
        wifi: true,
        ac: true,
        nonAc: false,
        restaurant: true,
        roomService: true,
        laundry: true,
        pickupDrop: true,
        hotWater: true,
        powerBackup: true,
        security: true,
        cctv: true,
        lift: true,
        other: ['Temple view balcony', 'Conference hall', 'Travel desk', 'Doctor on call'],
      },
      policies: {
        checkInTime: '14:00',
        checkOutTime: '12:00',
        cancellationPolicy: 'strict',
        advancePaymentPercentage: 30,
        allowPets: false,
        allowSmoking: false,
        allowUnmarriedCouples: true,
        minAge: 21,
      },
      pricing: {
        basePrice: 3500,
        currency: 'INR',
        taxPercentage: 18,
        serviceChargePercentage: 10,
      },
      status: 'approved',
      isFeatured: true,
      priority: 8,
      publishedAt: new Date(),
    },
  ];

  const createdLodges = [];

  for (const lodgeData of lodgesData) {
    const lodge = await Lodge.create({
      ...lodgeData,
      owner: owner._id,
    });

    // Add some placeholder images
    lodge.images = [
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        caption: 'Lodge Exterior',
        isPrimary: true,
        order: 0,
      },
      {
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        caption: 'Room Interior',
        isPrimary: false,
        order: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        caption: 'Restaurant',
        isPrimary: false,
        order: 2,
      },
    ];

    await lodge.save();
    createdLodges.push(lodge);
    console.log(`✅ Lodge created: ${lodge.name} (${lodge.address.distanceFromTemple}km from temple)`);
  }

  return createdLodges;
}

async function seedRoomCategories(lodges, owner) {
  console.log('\n🌱 Seeding Room Categories...');

  const existingCategories = await RoomCategory.countDocuments({ lodge: { $in: lodges.map((l) => l._id) } });

  if (existingCategories > 0) {
    console.log('✅ Room Categories already exist');
    return await RoomCategory.find({ lodge: { $in: lodges.map((l) => l._id) } });
  }

  const categoriesData = [
    // Sri Lakshmi Narasimha Nilayam
    {
      lodge: lodges[0]._id,
      name: 'AC Deluxe Double Room',
      description: 'Spacious air-conditioned room with double bed, attached bathroom, and modern amenities.',
      capacity: { adults: 2, children: 1, maxOccupancy: 3 },
      type: 'double',
      acType: 'ac',
      pricing: {
        basePrice: 2500,
        weekendPrice: 3000,
        holidayPrice: 3500,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 10,
      amenities: {
        bedType: 'queen',
        bedCount: 1,
        attachedBathroom: true,
        hotWater: true,
        tv: true,
        wifi: true,
        ac: true,
        fan: true,
        wardrobe: true,
        dressingTable: true,
        balcony: true,
        window: true,
        intercom: true,
        safe: true,
        miniFridge: true,
        teaCoffeeMaker: true,
        other: ['Temple view available'],
      },
      isActive: true,
      displayOrder: 1,
      pricingRules: {
        advancePercentage: 20,
        minimumStay: 1,
        maximumStay: 7,
        earlyBirdDiscount: { enabled: true, daysBefore: 7, discountPercentage: 10 },
        lastMinuteDiscount: { enabled: true, daysBefore: 1, discountPercentage: 5 },
      },
    },
    {
      lodge: lodges[0]._id,
      name: 'Non-AC Standard Double Room',
      description: 'Comfortable non-AC room with double bed, fan, and essential amenities.',
      capacity: { adults: 2, children: 1, maxOccupancy: 3 },
      type: 'double',
      acType: 'non_ac',
      pricing: {
        basePrice: 1500,
        weekendPrice: 1800,
        holidayPrice: 2200,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 15,
      amenities: {
        bedType: 'double',
        bedCount: 1,
        attachedBathroom: true,
        hotWater: true,
        tv: true,
        wifi: true,
        ac: false,
        fan: true,
        wardrobe: true,
        dressingTable: false,
        balcony: false,
        window: true,
        intercom: true,
        safe: false,
        miniFridge: false,
        teaCoffeeMaker: true,
      },
      isActive: true,
      displayOrder: 2,
      pricingRules: {
        advancePercentage: 20,
        minimumStay: 1,
        maximumStay: 7,
      },
    },
    {
      lodge: lodges[0]._id,
      name: 'AC Family Suite',
      description: 'Large family suite with two bedrooms, living area, and premium amenities.',
      capacity: { adults: 4, children: 2, maxOccupancy: 6 },
      type: 'family',
      acType: 'ac',
      pricing: {
        basePrice: 5000,
        weekendPrice: 6000,
        holidayPrice: 7500,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 5,
      amenities: {
        bedType: 'queen',
        bedCount: 2,
        attachedBathroom: true,
        hotWater: true,
        tv: true,
        wifi: true,
        ac: true,
        fan: true,
        wardrobe: true,
        dressingTable: true,
        balcony: true,
        window: true,
        intercom: true,
        safe: true,
        miniFridge: true,
        teaCoffeeMaker: true,
        other: ['Living room', 'Temple view', 'Bathtub'],
      },
      isActive: true,
      displayOrder: 3,
      pricingRules: {
        advancePercentage: 30,
        minimumStay: 2,
        maximumStay: 10,
        earlyBirdDiscount: { enabled: true, daysBefore: 14, discountPercentage: 15 },
      },
    },
    // Sri Anjaneya Swamy Lodge
    {
      lodge: lodges[1]._id,
      name: 'Non-AC Standard Room',
      description: 'Basic clean room with fan, attached bathroom, and hot water.',
      capacity: { adults: 2, children: 1, maxOccupancy: 3 },
      type: 'double',
      acType: 'non_ac',
      pricing: {
        basePrice: 800,
        weekendPrice: 1000,
        holidayPrice: 1200,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 20,
      amenities: {
        bedType: 'double',
        bedCount: 1,
        attachedBathroom: true,
        hotWater: true,
        tv: false,
        wifi: false,
        ac: false,
        fan: true,
        wardrobe: true,
        dressingTable: false,
        balcony: false,
        window: true,
        intercom: false,
        safe: false,
        miniFridge: false,
        teaCoffeeMaker: false,
      },
      isActive: true,
      displayOrder: 1,
      pricingRules: {
        advancePercentage: 10,
        minimumStay: 1,
        maximumStay: 15,
      },
    },
    {
      lodge: lodges[1]._id,
      name: 'Non-AC Triple Sharing',
      description: 'Budget-friendly triple sharing room for groups and families.',
      capacity: { adults: 3, children: 1, maxOccupancy: 4 },
      type: 'triple',
      acType: 'non_ac',
      pricing: {
        basePrice: 1200,
        weekendPrice: 1500,
        holidayPrice: 1800,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 10,
      amenities: {
        bedType: 'single',
        bedCount: 3,
        attachedBathroom: true,
        hotWater: true,
        tv: false,
        wifi: false,
        ac: false,
        fan: true,
        wardrobe: true,
        dressingTable: false,
        balcony: false,
        window: true,
        intercom: false,
        safe: false,
        miniFridge: false,
        teaCoffeeMaker: false,
      },
      isActive: true,
      displayOrder: 2,
      pricingRules: {
        advancePercentage: 10,
        minimumStay: 1,
        maximumStay: 15,
      },
    },
    // Divya Darshan Residency
    {
      lodge: lodges[2]._id,
      name: 'Premium AC Deluxe with Temple View',
      description: 'Luxury room with panoramic temple view, king bed, and premium amenities.',
      capacity: { adults: 2, children: 1, maxOccupancy: 3 },
      type: 'deluxe',
      acType: 'ac',
      pricing: {
        basePrice: 5000,
        weekendPrice: 6500,
        holidayPrice: 8000,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 8,
      amenities: {
        bedType: 'king',
        bedCount: 1,
        attachedBathroom: true,
        hotWater: true,
        tv: true,
        wifi: true,
        ac: true,
        fan: true,
        wardrobe: true,
        dressingTable: true,
        balcony: true,
        window: true,
        intercom: true,
        safe: true,
        miniFridge: true,
        teaCoffeeMaker: true,
        other: ['Temple view balcony', 'Bathtub', 'Premium toiletries', 'Butler service'],
      },
      isActive: true,
      displayOrder: 1,
      pricingRules: {
        advancePercentage: 30,
        minimumStay: 2,
        maximumStay: 10,
        earlyBirdDiscount: { enabled: true, daysBefore: 14, discountPercentage: 15 },
        lastMinuteDiscount: { enabled: false },
      },
    },
    {
      lodge: lodges[2]._id,
      name: 'AC Executive Suite',
      description: 'Executive suite with separate living room, work desk, and premium facilities.',
      capacity: { adults: 2, children: 2, maxOccupancy: 4 },
      type: 'suite',
      acType: 'ac',
      pricing: {
        basePrice: 7500,
        weekendPrice: 9000,
        holidayPrice: 11000,
        currency: 'INR',
        taxInclusive: true,
      },
      totalRooms: 4,
      amenities: {
        bedType: 'king',
        bedCount: 1,
        attachedBathroom: true,
        hotWater: true,
        tv: true,
        wifi: true,
        ac: true,
        fan: true,
        wardrobe: true,
        dressingTable: true,
        balcony: true,
        window: true,
        intercom: true,
        safe: true,
        miniFridge: true,
        teaCoffeeMaker: true,
        other: ['Living room', 'Work desk', 'Temple view', 'Bathtub', 'Premium toiletries', 'Butler service'],
      },
      isActive: true,
      displayOrder: 2,
      pricingRules: {
        advancePercentage: 30,
        minimumStay: 2,
        maximumStay: 14,
        earlyBirdDiscount: { enabled: true, daysBefore: 21, discountPercentage: 20 },
      },
    },
  ];

  const createdCategories = [];

  for (const catData of categoriesData) {
    const category = await RoomCategory.create({
      ...catData,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          caption: 'Room View',
          isPrimary: true,
          order: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
          caption: 'Bathroom',
          isPrimary: false,
          order: 1,
        },
      ],
    });

    createdCategories.push(category);
    console.log(`✅ Room Category created: ${category.name} (${category.totalRooms} rooms) - Lodge: ${lodges.find((l) => l._id.equals(category.lodge))?.name}`);
  }

  return createdCategories;
}

async function seedRoomInventory(categories) {
  console.log('\n🌱 Seeding Room Inventory (90 days)...');

  const existingInventory = await RoomInventory.countDocuments({
    roomCategory: { $in: categories.map((c) => c._id) },
  });

  if (existingInventory > 0) {
    console.log('✅ Room Inventory already exists');
    return;
  }

  const dates = generateDateRange(90);
  console.log(`   Generating inventory for ${dates.length} days across ${categories.length} categories...`);

  let totalCreated = 0;

  for (const category of categories) {
    const lodge = await require('../models/Lodge').findById(category.lodge);
    const operations = dates.map((date) => ({
      updateOne: {
        filter: { lodge: category.lodge, roomCategory: category._id, date },
        update: {
          $setOnInsert: {
            lodge: category.lodge,
            roomCategory: category._id,
            date,
            totalRooms: category.totalRooms,
            availableRooms: category.totalRooms,
            blockedRooms: 0,
            bookedRooms: [],
            offlineBookedRooms: [],
            reservedRooms: [],
            priceSnapshot: {
              basePrice: category.pricing.basePrice,
              weekendPrice: category.pricing.weekendPrice,
              holidayPrice: category.pricing.holidayPrice,
              currency: category.pricing.currency,
            },
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      const result = await RoomInventory.bulkWrite(operations, { ordered: false });
      totalCreated += result.upsertedCount + result.modifiedCount;
    }

    console.log(`   ✅ ${category.name}: ${dates.length} days of inventory created`);
  }

  console.log(`✅ Total inventory records created: ${totalCreated}`);
}

async function seedCustomer() {
  console.log('\n🌱 Seeding Test Customer...');

  const existingCustomer = await User.findOne({
    phone: '9876543211',
    role: 'customer',
  });

  if (existingCustomer) {
    console.log('✅ Test Customer already exists');
    return existingCustomer;
  }

  const customer = await User.create({
    phone: '9876543211',
    email: 'customer@yadadristay.com',
    password: await hashPassword('CustomerPass123!'),
    fullName: 'Priya Sharma',
    role: 'customer',
    isVerified: true,
    isActive: true,
    language: 'en',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'female',
    emergencyContact: {
      name: 'Rahul Sharma',
      phone: '9876543212',
      relationship: 'Husband',
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true,
        whatsapp: true,
      },
      language: 'en',
      currency: 'INR',
    },
    loyaltyPoints: 100,
  });

  console.log('✅ Test Customer created:', customer.phone);
  return customer;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    YADADRI STAY SEED SCRIPT                   ║
╚══════════════════════════════════════════════════════════════╝
  `);

  try {
    // Connect to database
    await connectDB();

    // Seed data in order
    const admin = await seedSuperAdmin();
    const owner = await seedLodgeOwner();
    const lodges = await seedLodges(owner);
    const categories = await seedRoomCategories(lodges, owner);
    await seedRoomInventory(categories);
    const customer = await seedCustomer();

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    SEEDING COMPLETE ✅                         ║
╠══════════════════════════════════════════════════════════════╣
║  Super Admin:    ${admin.phone} (admin@yadadristay.com)        ║
║  Lodge Owner:    ${owner.phone} (owner@yadadristay.com)        ║
║  Test Customer:  ${customer.phone} (customer@yadadristay.com)  ║
║  Lodges:         ${lodges.length} temple lodges                    ║
║  Room Categories: ${categories.length} room types                     ║
║  Inventory:      90 days for all categories                    ║
║                                                              ║
║  Default Password: SecureAdminPass123! / OwnerPass123!       ║
║           CustomerPass123!                                    ║
╚══════════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };