/**
 * Sensor Data Routes
 * API endpoints for sensor data operations
 */

const express = require('express');

const createSensorDataRoutes = (sensorDataController) => {
  const router = express.Router();

  /**
   * GET /api/data
   * Get latest sensor reading
   */
  router.get('/data', (req, res) => {
    sensorDataController.getLatestData(req, res);
  });

  /**
   * GET /api/history
   * Get sensor data history
   * Query params: limit (default: 100, max: 500), skip (default: 0)
   */
  router.get('/history', (req, res) => {
    sensorDataController.getDataHistory(req, res);
  });

  /**
   * GET /api/statistics
   * Get sensor data statistics
   * Query params: hours (default: 24, max: 720)
   */
  router.get('/statistics', (req, res) => {
    sensorDataController.getDataStatistics(req, res);
  });

  /**
   * GET /api/data/range
   * Get sensor data within date range
   * Query params: startDate, endDate (ISO format)
   */
  router.get('/data/range', (req, res) => {
    sensorDataController.getDataByDateRange(req, res);
  });

  return router;
};

module.exports = createSensorDataRoutes;
