/**
 * File Upload Middleware
 * Multer configuration for handling file uploads
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { BadRequestError } = require('../utils/errors');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

/**
 * File filter for videos
 */
const videoFileFilter = (req, file, cb) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only MP4, WebM, and QuickTime videos are allowed'), false);
  }
};

/**
 * File filter for documents
 */
const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF, JPEG, and PNG documents are allowed'), false);
  }
};

/**
 * File filter for all allowed types
 */
const allFileFilter = (req, file, cb) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type'), false);
  }
};

/**
 * Generate unique filename
 */
const generateFileName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  return `${name}_${uuidv4()}${ext}`;
};

/**
 * Memory storage for Cloudinary upload
 */
const memoryStorage = multer.memoryStorage();

/**
 * Disk storage for local development
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  },
});

// Use memory storage for production (Cloudinary), disk for development
const storage = process.env.NODE_ENV === 'production' ? memoryStorage : diskStorage;

/**
 * Create multer upload instance for images
 */
const uploadImage = (fieldName, maxCount = 1) => {
  return multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: MAX_IMAGE_SIZE,
      files: maxCount,
    },
  }).array(fieldName, maxCount);
};

/**
 * Create multer upload instance for videos
 */
const uploadVideo = (fieldName, maxCount = 1) => {
  return multer({
    storage,
    fileFilter: videoFileFilter,
    limits: {
      fileSize: MAX_VIDEO_SIZE,
      files: maxCount,
    },
  }).array(fieldName, maxCount);
};

/**
 * Create multer upload instance for documents
 */
const uploadDocument = (fieldName, maxCount = 1) => {
  return multer({
    storage,
    fileFilter: documentFileFilter,
    limits: {
      fileSize: MAX_DOCUMENT_SIZE,
      files: maxCount,
    },
  }).array(fieldName, maxCount);
};

/**
 * Create multer upload instance for mixed files
 */
const uploadMixed = (fields) => {
  return multer({
    storage,
    fileFilter: allFileFilter,
    limits: {
      fileSize: MAX_VIDEO_SIZE, // Use largest limit
      files: fields.reduce((sum, f) => sum + (f.maxCount || 1), 0),
    },
  }).fields(fields);
};

/**
 * Specific upload configurations
 */

// Lodge images
const uploadLodgeImages = uploadMixed([
  { name: 'images', maxCount: 20 },
  { name: 'videos', maxCount: 5 },
]);

// Room category images
const uploadRoomImages = uploadMixed([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 3 },
]);

// Payment screenshot
const uploadPaymentScreenshot = uploadImage('screenshot', 1);

// Review images
const uploadReviewImages = uploadImage('images', 5);

// Complaint attachments
const uploadComplaintAttachments = uploadMixed([
  { name: 'attachments', maxCount: 5 },
]);

// Profile image
const uploadProfileImage = uploadImage('profileImage', 1);

// Lodge documents
const uploadLodgeDocuments = uploadMixed([
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'bankPassbook', maxCount: 1 },
  { name: 'ownershipProof', maxCount: 1 },
]);

// UPI QR Code
const uploadUpiQrCode = uploadImage('qrCode', 1);

/**
 * Error handler for multer
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds limit',
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded',
        code: 'TOO_MANY_FILES',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field: ${err.field}`,
        code: 'UNEXPECTED_FILE',
      });
    }
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  next(err);
};

/**
 * Process uploaded files and upload to Cloudinary
 */
const processUploads = async (req, res, next) => {
  // This would be implemented with Cloudinary upload
  // For now, files are stored in memory or disk
  next();
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadMixed,
  uploadLodgeImages,
  uploadRoomImages,
  uploadPaymentScreenshot,
  uploadReviewImages,
  uploadComplaintAttachments,
  uploadProfileImage,
  uploadLodgeDocuments,
  uploadUpiQrCode,
  handleUploadError,
  processUploads,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_DOCUMENT_SIZE,
};