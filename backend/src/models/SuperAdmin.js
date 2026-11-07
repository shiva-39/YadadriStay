/**
 * Super Admin Model
 * Discriminator for User with role 'super_admin'
 */

const mongoose = require('mongoose');
const User = require('./User');

const superAdminSchema = new mongoose.Schema(
  {
    // Super admin specific fields can be added here
    permissions: {
      type: [String],
      default: ['all'],
    },
    department: {
      type: String,
      default: 'administration',
    },
  },
  {
    timestamps: true,
  }
);

const SuperAdmin = User.discriminator('super_admin', superAdminSchema);

module.exports = SuperAdmin;