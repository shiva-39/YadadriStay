/**
 * Authentication Routes
 * Login, register, token refresh, logout
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidation, rules } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', rules.register, handleValidation, catchAsync(authController.register));

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', rules.login, handleValidation, catchAsync(authController.login));

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', rules.refreshToken, handleValidation, catchAsync(authController.refreshToken));

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, catchAsync(authController.logout));

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, catchAsync(authController.getMe));

/**
 * @route PUT /api/auth/me
 * @desc Update current user profile
 * @access Private
 */
router.put('/me', authenticate, rules.updateProfile, handleValidation, catchAsync(authController.updateProfile));

/**
 * @route PUT /api/auth/change-password
 * @desc Change password
 * @access Private
 */
router.put('/change-password', authenticate, rules.changePassword, handleValidation, catchAsync(authController.changePassword));

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset (placeholder - would need email/SMS)
 * @access Public
 */
router.post('/forgot-password', catchAsync(authController.forgotPassword));

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password (placeholder)
 * @access Public
 */
router.post('/reset-password', catchAsync(authController.resetPassword));

module.exports = router;