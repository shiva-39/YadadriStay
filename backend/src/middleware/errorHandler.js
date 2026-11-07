/**
 * Global Error Handler Middleware
 * Centralized error handling for all routes
 */

const {
  AppError,
  handleValidationError,
  handleDuplicateKeyError,
  handleCastError,
  handleJWTError,
  handleMulterError,
} = require('../utils/errors');

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    code: err.code,
    details: err.details,
    stack: err.stack,
    timestamp: err.timestamp,
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: err.timestamp,
    });
  }
  // Programming errors: don't leak details
  else {
    console.error('ERROR 💥:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.code = err.code || 'INTERNAL_ERROR';
  err.timestamp = err.timestamp || new Date().toISOString();

  // Log error
  console.error(`[${err.timestamp}] ${err.code}: ${err.message}`, {
    path: req.path,
    method: req.method,
    user: req.user?.id,
    stack: err.stack,
  });

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') error = handleJWTError(err);
  if (err.name === 'MulterError') error = handleMulterError(err);

  // Handle Mongoose errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    error = new AppError('Database error', 500, 'DATABASE_ERROR');
  }

  // Send response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(err);
};

/**
 * Async error wrapper
 * Catches errors in async route handlers
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error formatter for express-validator
 */
const formatValidationErrors = (errors) => {
  return errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value,
    location: err.location,
  }));
};

module.exports = {
  errorHandler,
  notFound,
  catchAsync,
  formatValidationErrors,
};