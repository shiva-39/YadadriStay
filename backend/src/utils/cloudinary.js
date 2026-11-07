/**
 * Cloudinary Utility
 * Image and video upload/management using Cloudinary
 */

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload buffer to Cloudinary
 */
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'yadadri-stay',
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation || [],
      tags: options.tags || [],
      context: options.context || {},
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Upload file from path to Cloudinary
 */
const uploadFile = (filePath, options = {}) => {
  return cloudinary.uploader.upload(filePath, {
    folder: options.folder || 'yadadri-stay',
    resource_type: options.resource_type || 'auto',
    transformation: options.transformation || [],
    tags: options.tags || [],
    context: options.context || {},
    ...options,
  });
};

/**
 * Upload multiple buffers
 */
const uploadMultipleBuffers = async (buffers, options = {}) => {
  const uploadPromises = buffers.map((buffer, index) =>
    uploadBuffer(buffer, {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
    })
  );

  return Promise.all(uploadPromises);
};

/**
 * Delete file from Cloudinary
 */
const deleteFile = (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

/**
 * Delete multiple files
 */
const deleteMultipleFiles = async (publicIds, resourceType = 'image') => {
  const deletePromises = publicIds.map((publicId) => deleteFile(publicId, resourceType));
  return Promise.all(deletePromises);
};

/**
 * Delete folder contents
 */
const deleteFolder = (folder) => {
  return cloudinary.api.delete_resources_by_prefix(folder);
};

/**
 * Get file info
 */
const getFileInfo = (publicId, resourceType = 'image') => {
  return cloudinary.api.resource(publicId, {
    resource_type: resourceType,
  });
};

/**
 * Generate optimized URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  });
};

/**
 * Generate thumbnail URL
 */
const getThumbnailUrl = (publicId, width = 300, height = 200, options = {}) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  });
};

/**
 * Generate video thumbnail URL
 */
const getVideoThumbnailUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    width: 300,
    height: 200,
    crop: 'fill',
    gravity: 'auto',
    ...options,
  });
};

/**
 * Upload lodge images with proper transformations
 */
const uploadLodgeImage = async (buffer, lodgeId, options = {}) => {
  return uploadBuffer(buffer, {
    folder: `yadadri-stay/lodges/${lodgeId}`,
    tags: ['lodge', lodgeId],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload room category images
 */
const uploadRoomImage = async (buffer, lodgeId, categoryId, options = {}) => {
  return uploadBuffer(buffer, {
    folder: `yadadri-stay/lodges/${lodgeId}/rooms/${categoryId}`,
    tags: ['room', lodgeId, categoryId],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload payment screenshot
 */
const uploadPaymentScreenshot = async (buffer, paymentId, options = {}) => {
  return uploadBuffer(buffer, {
    folder: 'yadadri-stay/payments',
    tags: ['payment', 'screenshot', paymentId],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload review images
 */
const uploadReviewImage = async (buffer, reviewId, options = {}) => {
  return uploadBuffer(buffer, {
    folder: 'yadadri-stay/reviews',
    tags: ['review', reviewId],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload complaint attachment
 */
const uploadComplaintAttachment = async (buffer, complaintId, options = {}) => {
  return uploadBuffer(buffer, {
    folder: 'yadadri-stay/complaints',
    tags: ['complaint', complaintId],
    resource_type: 'auto',
    ...options,
  });
};

/**
 * Upload profile image
 */
const uploadProfileImage = async (buffer, userId, options = {}) => {
  return uploadBuffer(buffer, {
    folder: 'yadadri-stay/profiles',
    tags: ['profile', userId],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload UPI QR Code
 */
const uploadUpiQrCode = async (buffer, options = {}) => {
  return uploadBuffer(buffer, {
    folder: 'yadadri-stay/upi',
    tags: ['upi', 'qr-code'],
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload lodge documents
 */
const uploadLodgeDocument = async (buffer, lodgeId, documentType, options = {}) => {
  return uploadBuffer(buffer, {
    folder: `yadadri-stay/lodges/${lodgeId}/documents`,
    tags: ['document', documentType, lodgeId],
    resource_type: 'auto',
    ...options,
  });
};

/**
 * Search resources
 */
const searchResources = (expression, options = {}) => {
  return cloudinary.search
    .expression(expression)
    .max_results(options.max_results || 50)
    .sort_by('created_at', 'desc')
    .execute();
};

/**
 * Get usage stats
 */
const getUsageStats = () => {
  return cloudinary.api.usage();
};

/**
 * Create upload preset (for direct client uploads)
 */
const createUploadPreset = async (name, options = {}) => {
  return cloudinary.api.create_upload_preset({
    name,
    unsigned: true,
    folder: options.folder || 'yadadri-stay/uploads',
    tags: options.tags || [],
    transformation: options.transformation || [],
    ...options,
  });
};

module.exports = {
  cloudinary,
  uploadBuffer,
  uploadFile,
  uploadMultipleBuffers,
  deleteFile,
  deleteMultipleFiles,
  deleteFolder,
  getFileInfo,
  getOptimizedUrl,
  getThumbnailUrl,
  getVideoThumbnailUrl,
  uploadLodgeImage,
  uploadRoomImage,
  uploadPaymentScreenshot,
  uploadReviewImage,
  uploadComplaintAttachment,
  uploadProfileImage,
  uploadUpiQrCode,
  uploadLodgeDocument,
  searchResources,
  getUsageStats,
  createUploadPreset,
};