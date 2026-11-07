/**
 * Upload Controller
 * Handles generic file uploads
 */

const { uploadBuffer } = require('../utils/cloudinary');
const { BadRequestError } = require('../utils/errors');

/**
 * Upload single image
 */
const uploadImage = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No image file provided');
  }

  try {
    const result = await uploadBuffer(req.file.buffer, {
      folder: 'yadadri-stay/uploads',
      tags: ['upload', 'image'],
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    throw new BadRequestError('Failed to upload image');
  }
};

/**
 * Upload multiple images
 */
const uploadImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new BadRequestError('No image files provided');
  }

  try {
    const uploads = await Promise.all(
      req.files.map(file =>
        uploadBuffer(file.buffer, {
          folder: 'yadadri-stay/uploads',
          tags: ['upload', 'image'],
          transformation: [
            { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        })
      )
    );

    const images = uploads.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }));

    res.json({
      success: true,
      message: `${images.length} images uploaded successfully`,
      data: { images },
    });
  } catch (error) {
    console.error('Images upload error:', error);
    throw new BadRequestError('Failed to upload images');
  }
};

/**
 * Upload single video
 */
const uploadVideo = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No video file provided');
  }

  try {
    const result = await uploadBuffer(req.file.buffer, {
      folder: 'yadadri-stay/uploads',
      resource_type: 'video',
      tags: ['upload', 'video'],
    });

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        duration: result.duration,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Video upload error:', error);
    throw new BadRequestError('Failed to upload video');
  }
};

/**
 * Upload single document
 */
const uploadDocument = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No document file provided');
  }

  try {
    const result = await uploadBuffer(req.file.buffer, {
      folder: 'yadadri-stay/uploads',
      resource_type: 'auto',
      tags: ['upload', 'document'],
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    throw new BadRequestError('Failed to upload document');
  }
};

/**
 * Upload mixed files
 */
const uploadMixed = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    throw new BadRequestError('No files provided');
  }

  try {
    const results = {};

    for (const [fieldName, files] of Object.entries(req.files)) {
      results[fieldName] = await Promise.all(
        files.map(file => {
          const isVideo = file.mimetype.startsWith('video/');
          return uploadBuffer(file.buffer, {
            folder: 'yadadri-stay/uploads',
            resource_type: isVideo ? 'video' : 'auto',
            tags: ['upload', fieldName],
            transformation: isVideo
              ? undefined
              : [
                  { width: 1920, height: 1080, crop: 'limit', quality: 'auto' },
                  { fetch_format: 'auto' },
                ],
          });
        })
      );
    }

    const formattedResults = {};
    for (const [fieldName, uploads] of Object.entries(results)) {
      formattedResults[fieldName] = uploads.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration,
        bytes: result.bytes,
      }));
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: { files: formattedResults },
    });
  } catch (error) {
    console.error('Mixed upload error:', error);
    throw new BadRequestError('Failed to upload files');
  }
};

module.exports = {
  uploadImage,
  uploadImages,
  uploadVideo,
  uploadDocument,
  uploadMixed,
};