/**
 * Request Validation Middleware
 * Validates incoming requests
 */

const logger = require('../utils/logger');

const validateSensorData = (req, res, next) => {
  try {
    const { pm25, co, nox, timestamp } = req.body;

    if (!pm25 || !co || !nox) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pm25, co, nox',
      });
    }

    const pm25Num = parseFloat(pm25);
    const coNum = parseFloat(co);
    const noxNum = parseFloat(nox);

    if (isNaN(pm25Num) || isNaN(coNum) || isNaN(noxNum)) {
      return res.status(400).json({
        success: false,
        error: 'Sensor values must be numbers',
      });
    }

    if (pm25Num < 0 || coNum < 0 || noxNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Sensor values cannot be negative',
      });
    }

    next();
  } catch (error) {
    logger.error('Error in validateSensorData:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Validation error',
    });
  }
};

module.exports = {
  validateSensorData,
};
