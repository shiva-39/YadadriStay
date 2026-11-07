/**
 * Models Index
 * Exports all Mongoose models
 */

const User = require('./User');
const Customer = require('./Customer');
const LodgeOwner = require('./LodgeOwner');
const SuperAdmin = require('./SuperAdmin');
const Lodge = require('./Lodge');
const RoomCategory = require('./RoomCategory');
const RoomInventory = require('./RoomInventory');
const Booking = require('./Booking');
const OfflineBooking = require('./OfflineBooking');
const Payment = require('./Payment');
const Settlement = require('./Settlement');
const Review = require('./Review');
const TransportRequest = require('./TransportRequest');
const Complaint = require('./Complaint');
const Notification = require('./Notification');
const AdminSettings = require('./AdminSettings');
const ActivityLog = require('./ActivityLog');

module.exports = {
  User,
  Customer,
  LodgeOwner,
  SuperAdmin,
  Lodge,
  RoomCategory,
  RoomInventory,
  Booking,
  OfflineBooking,
  Payment,
  Settlement,
  Review,
  TransportRequest,
  Complaint,
  Notification,
  AdminSettings,
  ActivityLog,
};