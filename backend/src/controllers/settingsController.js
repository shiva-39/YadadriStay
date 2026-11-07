/**
 * Settings Controller
 * Handles platform settings management
 */

const AdminSettings = require('../models/AdminSettings');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { uploadUpiQrCode: uploadUpiQrCodeUtil } = require('../utils/cloudinary');
const { BadRequestError } = require('../utils/errors');

/**
 * Get all platform settings
 */
const getSettings = async (req, res) => {
  const settings = await AdminSettings.getSettings();

  res.json({
    success: true,
    data: { settings: settings.toObject() },
  });
};

/**
 * Get specific settings section
 */
const getSettingsSection = async (req, res) => {
  const { section } = req.params;

  const validSections = [
    'upi', 'payments', 'timings', 'booking', 'cancellation',
    'commissions', 'lodgeApproval', 'reviews', 'notifications',
    'security', 'rateLimiting', 'upload', 'temple', 'features',
    'contact', 'legal',
  ];

  if (!validSections.includes(section)) {
    throw new BadRequestError('Invalid settings section');
  }

  const sectionData = await AdminSettings.getSection(section);

  res.json({
    success: true,
    data: { section, settings: sectionData },
  });
};

/**
 * Update platform settings
 */
const updateSettings = async (req, res) => {
  const settings = await AdminSettings.updateSettings(req.body, req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'update_settings',
    actionCategory: 'settings',
    entityType: 'admin_settings',
    entityId: 'global_settings',
    description: 'Updated platform settings',
    metadata: { sections: Object.keys(req.body) },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: { settings: settings.toObject() },
  });
};

/**
 * Update specific settings section
 */
const updateSettingsSection = async (req, res) => {
  const { section } = req.params;

  const validSections = [
    'upi', 'payments', 'timings', 'booking', 'cancellation',
    'commissions', 'lodgeApproval', 'reviews', 'notifications',
    'security', 'rateLimiting', 'upload', 'temple', 'features',
    'contact', 'legal',
  ];

  if (!validSections.includes(section)) {
    throw new BadRequestError('Invalid settings section');
  }

  const updates = { [section]: req.body };
  const settings = await AdminSettings.updateSettings(updates, req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'update_settings_section',
    actionCategory: 'settings',
    entityType: 'admin_settings',
    entityId: 'global_settings',
    description: `Updated ${section} settings`,
    metadata: { section },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `${section} settings updated successfully`,
    data: { settings: settings.toObject() },
  });
};

/**
 * Upload UPI QR code
 */
const uploadUpiQrCode = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('QR code image is required');
  }

  const result = await uploadUpiQrCodeUtil(req.file.buffer);

  const settings = await AdminSettings.getSettings();
  settings.upi.qrCodeUrl = result.secure_url;
  settings.upi.qrCodePublicId = result.public_id;
  await settings.save();

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'upload_upi_qr',
    actionCategory: 'settings',
    entityType: 'admin_settings',
    entityId: 'global_settings',
    description: 'Uploaded new UPI QR code',
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'UPI QR code uploaded successfully',
    data: { qrCodeUrl: result.secure_url },
  });
};

module.exports = {
  getSettings,
  getSettingsSection,
  updateSettings,
  updateSettingsSection,
  uploadUpiQrCode,
};