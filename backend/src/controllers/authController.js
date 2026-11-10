/**
 * Authentication Controller
 * Handles user authentication, registration, and token management
 */

const User = require('../models/User');
const Customer = require('../models/Customer');
const LodgeOwner = require('../models/LodgeOwner');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Register new user
 */
const register = async (req, res) => {
  const { phone, password, fullName, email, role = 'customer' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ConflictError('Phone number already registered');
  }

  if (email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }
  }

  // Create user
  const user = await User.create({
    phone,
    password,
    fullName,
    email,
    role,
  });

  // Create role-specific profile
  if (role === 'customer') {
    await Customer.create({ _id: user._id });
  } else if (role === 'lodge_owner') {
    await LodgeOwner.create({ _id: user._id });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Log activity
  await ActivityLog.logAuth(user, 'register', true, { ip: req.ip, userAgent: req.get('user-agent') });

  // Send welcome notification
  await Notification.createNotification({
    user: user._id,
    type: 'system_announcement',
    title: 'Welcome to Yadadri Stay!',
    message: 'Your account has been created successfully. Start exploring lodges around Yadadri Temple.',
    priority: 'normal',
  });

  // Set cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken, // Include for mobile clients
    },
  });
};

/**
 * Login user
 */
const login = async (req, res) => {
  const { phone, password } = req.body;

  // Find user by credentials
  const user = await User.findByCredentials(phone, password);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Log activity
  await ActivityLog.logAuth(user, 'login', true, { ip: req.ip, userAgent: req.get('user-agent') });

  // Set cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        language: user.language,
      },
      accessToken,
      refreshToken, // Include for mobile clients
    },
  });
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new BadRequestError('Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if refresh token matches
    if (user.refreshToken !== token) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken,
        refreshToken: newRefreshToken, // Include for mobile clients
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  const user = req.user;

  // Clear refresh token
  user.refreshToken = null;
  await user.save();

  // Log activity
  await ActivityLog.logAuth(user, 'logout', true, { ip: req.ip, userAgent: req.get('user-agent') });

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Get current user profile
 */
const getMe = async (req, res) => {
  const user = req.user;

  // Get role-specific data
  let profileData = {};
  if (user.role === 'customer') {
    const customer = await Customer.findById(user._id);
    if (customer) {
      profileData = {
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        emergencyContact: customer.emergencyContact,
        preferences: customer.preferences,
        loyaltyPoints: customer.loyaltyPoints,
        totalBookings: customer.totalBookings,
        completedStays: customer.completedStays,
        walletBalance: customer.walletBalance,
      };
    }
  } else if (user.role === 'lodge_owner') {
    const owner = await LodgeOwner.findById(user._id);
    if (owner) {
      profileData = {
        businessName: owner.businessName,
        gstNumber: owner.gstNumber,
        panNumber: owner.panNumber,
        bankDetails: owner.bankDetails,
        upiId: owner.upiId,
        verificationStatus: owner.verificationStatus,
        commissionRate: owner.commissionRate,
        settlementCycle: owner.settlementCycle,
        totalRevenue: owner.totalRevenue,
        totalBookings: owner.totalBookings,
        averageRating: owner.averageRating,
      };
    }
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        language: user.language,
        profileImage: user.profileImage,
        address: user.address,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        ...profileData,
      },
    },
  });
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  const user = req.user;
  const { fullName, email, dateOfBirth, gender, language, address, emergencyContact } = req.body;

  // Update base user fields
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (language) user.language = language;
  if (address) user.address = { ...user.address, ...address };

  await user.save();

  // Update role-specific profile
  if (user.role === 'customer') {
    const customer = await Customer.findById(user._id);
    if (customer) {
      if (dateOfBirth) customer.dateOfBirth = dateOfBirth;
      if (gender) customer.gender = gender;
      if (emergencyContact) customer.emergencyContact = emergencyContact;
      await customer.save();
    }
  }

  // Log activity
  await ActivityLog.logAuth(user, 'profile_update', true, { ip: req.ip });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: await getMe(req, res) }, // This would need adjustment
  });
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  const user = req.user;
  const { currentPassword, newPassword } = req.body;

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Log activity
  await ActivityLog.logAuth(user, 'password_change', true, { ip: req.ip });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
};

/**
 * Forgot password (placeholder)
 */
const forgotPassword = async (req, res) => {
  // In a real implementation, this would send an OTP via SMS or email
  // For now, we'll just return a success message
  res.json({
    success: true,
    message: 'If the phone number is registered, a reset link will be sent',
  });
};

/**
 * Reset password (placeholder)
 */
const resetPassword = async (req, res) => {
  // In a real implementation, this would verify OTP and reset password
  res.json({
    success: true,
    message: 'Password reset functionality not implemented yet',
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};