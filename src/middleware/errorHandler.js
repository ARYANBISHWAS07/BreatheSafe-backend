/**
 * Error Handling Middleware
 * Centralized error handling for all routes
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error caught by middleware:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');

    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }

  // Generic error response
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
