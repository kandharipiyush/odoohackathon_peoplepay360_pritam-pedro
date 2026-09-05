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
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let errorMessage = err.message || 'Internal Server Error';

  // Handle specific MySQL DB errors gracefully
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    if (err.sqlMessage && err.sqlMessage.includes('email')) {
      errorMessage = 'A user or employee with this email address already exists. Please use a unique email.';
    } else {
      errorMessage = 'A duplicate record already exists. Please ensure unique fields are not duplicated.';
    }
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    errorMessage = 'Invalid reference: The associated employee, manager, contract, or salary structure was not found.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    errorMessage = 'Cannot delete or update this record because other active records depend on it.';
  } else if (err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    statusCode = 400;
    errorMessage = 'Data format error: Provided value exceeds allowable length or does not match acceptable options.';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  logger.error('API Error Encountered', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    error: errorMessage,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const responseBody = {
    success: false,
    error: errorMessage,
    message: errorMessage,
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
