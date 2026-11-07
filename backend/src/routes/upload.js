/**
 * Upload Routes
 * Generic file upload endpoints
 */

const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { uploadImage, uploadVideo, uploadDocument, uploadMixed, handleUploadError } = require('../middleware/upload');

/**
 * @route POST /api/upload/image
 * @desc Upload single image
 * @access Private
 */
router.post('/image', authenticate, uploadImage('image', 1), handleUploadError, catchAsync(uploadController.uploadImage));

/**
 * @route POST /api/upload/images
 * @desc Upload multiple images
 * @access Private
 */
router.post('/images', authenticate, uploadImage('images', 10), handleUploadError, catchAsync(uploadController.uploadImages));

/**
 * @route POST /api/upload/video
 * @desc Upload single video
 * @access Private
 */
router.post('/video', authenticate, uploadVideo('video', 1), handleUploadError, catchAsync(uploadController.uploadVideo));

/**
 * @route POST /api/upload/document
 * @desc Upload single document
 * @access Private
 */
router.post('/document', authenticate, uploadDocument('document', 1), handleUploadError, catchAsync(uploadController.uploadDocument));

/**
 * @route POST /api/upload/mixed
 * @desc Upload mixed files
 * @access Private
 */
router.post('/mixed', authenticate, uploadMixed([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 3 },
  { name: 'documents', maxCount: 5 },
]), handleUploadError, catchAsync(uploadController.uploadMixed));

module.exports = router;