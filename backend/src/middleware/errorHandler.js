const logger = require('../utils/logger');

/**
 * Global 404 Route Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global centralized error-handling middleware
 * Ensures predictable { success: false, error: message } response format
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const errorMessage = err.message || 'Internal Server Error';

  logger.error('API Error Encountered', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    error: errorMessage,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const responseBody = {
    success: false,
    error: errorMessage,
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
