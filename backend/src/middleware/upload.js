/**
 * File Upload Middleware
 * Multer configuration for handling file uploads
 * Supports Cloudinary in production, local disk storage as fallback
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { BadRequestError } = require('../utils/errors');

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME &&
         process.env.CLOUDINARY_API_KEY &&
         process.env.CLOUDINARY_API_SECRET;
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

// Uploads directory path
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  // Create subdirectories for different upload types
  const subDirs = ['payments', 'lodges', 'rooms', 'reviews', 'complaints', 'profiles', 'upi', 'documents'];
  for (const dir of subDirs) {
    const dirPath = path.join(UPLOADS_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
};

// Initialize uploads directory on module load
ensureUploadsDir();

/**
 * Get local file URL for serving via Express static middleware
 */
const getLocalFileUrl = (filename, subDir = '') => {
  // Use base URL without /api prefix since static files are served at /uploads
  const baseUrl = process.env.FILE_BASE_URL || process.env.API_BASE_URL?.replace(/\/api$/, '') || `http://localhost:${process.env.PORT || 5000}`;
  const prefix = subDir ? `${subDir}/` : '';
  return `${baseUrl}/uploads/${prefix}${filename}`;
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
 * Disk storage for local development / Cloudinary fallback
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subdirectory based on field name or route
    let subDir = 'misc';
    if (file.fieldname === 'screenshot') subDir = 'payments';
    else if (file.fieldname === 'images') subDir = 'lodges';
    else if (file.fieldname === 'videos') subDir = 'lodges';
    else if (file.fieldname === 'profileImage') subDir = 'profiles';
    else if (file.fieldname === 'qrCode') subDir = 'upi';
    else if (file.fieldname === 'attachments') subDir = 'complaints';
    else if (['gstCertificate', 'panCard', 'aadhaarCard', 'bankPassbook', 'ownershipProof'].includes(file.fieldname)) subDir = 'documents';

    const uploadPath = path.join(UPLOADS_DIR, subDir);
    ensureUploadsDir(); // Ensure directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  },
});

// Use memory storage for production with Cloudinary, disk for development or when Cloudinary not configured
const useCloudinary = process.env.NODE_ENV === 'production' && isCloudinaryConfigured();
const storage = useCloudinary ? memoryStorage : diskStorage;

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
}

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

// Payment screenshot - use single for single file upload
const uploadPaymentScreenshot = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
}).single('screenshot');

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
 * Process uploaded files and upload to Cloudinary (if configured)
 * Otherwise, files are already saved to disk via multer diskStorage
 * This middleware adds file URLs to req.files for consistent handling
 */
const processUploads = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // If using Cloudinary, upload files from memory buffer
    if (useCloudinary) {
      const { uploadBuffer } = require('../utils/cloudinary');
      const uploadPromises = req.files.map(async (file) => {
        const folder = file.fieldname === 'screenshot' ? 'yadadri-stay/payments'
                      : file.fieldname === 'images' ? 'yadadri-stay/lodges'
                      : file.fieldname === 'videos' ? 'yadadri-stay/lodges'
                      : file.fieldname === 'profileImage' ? 'yadadri-stay/profiles'
                      : file.fieldname === 'qrCode' ? 'yadadri-stay/upi'
                      : file.fieldname === 'attachments' ? 'yadadri-stay/complaints'
                      : 'yadadri-stay/misc';

        const result = await uploadBuffer(file.buffer, { folder });
        return {
          ...file,
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
        };
      });

      req.files = await Promise.all(uploadPromises);
    } else {
      // Using disk storage - files are already saved
      // Add local URLs to file objects for consistent access
      req.files = req.files.map(file => ({
        ...file,
        localUrl: getLocalFileUrl(file.filename, path.basename(file.destination)),
      }));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Get file URL from uploaded file (handles both Cloudinary and local)
 */
const getFileUrl = (file) => {
  if (file.cloudinaryUrl) return file.cloudinaryUrl;
  if (file.localUrl) return file.localUrl;
  // Fallback: construct from filename
  if (file.filename) {
    const subDir = file.destination ? path.basename(file.destination) : '';
    return getLocalFileUrl(file.filename, subDir);
  }
  return null;
};

/**
 * Get file public ID (for Cloudinary) or filename (for local)
 */
const getFileIdentifier = (file) => {
  if (file.cloudinaryPublicId) return file.cloudinaryPublicId;
  if (file.filename) return file.filename;
  return null;
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
  getLocalFileUrl,
  getFileUrl,
  getFileIdentifier,
  isCloudinaryConfigured,
  useCloudinary,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_DOCUMENT_SIZE,
};