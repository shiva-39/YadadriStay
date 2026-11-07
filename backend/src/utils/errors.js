/**
 * Custom Error Classes
 * Standardized error handling across the application
 */

class AppError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = {}) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = {}) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = {}) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = {}) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = {}) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details = {}) {
    super(message, 429, 'RATE_LIMITED', details);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details = {}) {
    super(message, 500, 'INTERNAL_ERROR', details);
    this.isOperational = false;
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details = {}) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = {}) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.isOperational = false;
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error', details = {}) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((err) => ({
    field: err.path,
    message: err.message,
    value: err.value,
  }));

  return new ValidationError('Validation failed', { errors });
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];

  let message = `${field} already exists`;
  if (field === 'phone') message = 'Phone number already registered';
  if (field === 'email') message = 'Email already registered';
  if (field === 'upi.transactionRef') message = 'Transaction reference already used';

  return new ConflictError(message, { field, value });
};

/**
 * Handle Mongoose cast errors
 */
const handleCastError = (error) => {
  return new BadRequestError(`Invalid ${error.path}: ${error.value}`, {
    field: error.path,
    value: error.value,
  });
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token. Please log in again.');
  }
  if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired. Please log in again.');
  }
  return new UnauthorizedError('Authentication failed');
};

/**
 * Handle Multer errors
 */
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new BadRequestError('File size exceeds limit');
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new BadRequestError('Too many files uploaded');
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new BadRequestError('Unexpected file field');
  }
  return new BadRequestError('File upload error');
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  handleValidationError,
  handleDuplicateKeyError,
  handleCastError,
  handleJWTError,
  handleMulterError,
};