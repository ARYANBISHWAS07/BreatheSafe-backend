/**
 * Sensor Data Controller
 * Handles HTTP requests for sensor data
 */

const logger = require('../utils/logger');

class SensorDataController {
  constructor(sensorDataService) {
    this.sensorDataService = sensorDataService;
  }

  /**
   * GET /api/data
   * Get latest sensor data
   */
  async getLatestData(req, res) {
    try {
      const data = await this.sensorDataService.getLatestData();

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'No sensor data available',
        });
      }

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error in getLatestData:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/history
   * Get sensor data history with pagination
   */
  async getDataHistory(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);
      const skip = Math.max(parseInt(req.query.skip) || 0, 0);

      const data = await this.sensorDataService.getDataHistory(limit, skip);

      return res.json({
        success: true,
        data,
        pagination: {
          limit,
          skip,
          count: data.length,
        },
      });
    } catch (error) {
      logger.error('Error in getDataHistory:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/statistics
   * Get sensor data statistics
   */
  async getDataStatistics(req, res) {
    try {
      const hours = Math.min(parseInt(req.query.hours) || 24, 720);
      const stats = await this.sensorDataService.getDataStatistics(hours);

      return res.json({
        success: true,
        data: stats,
        period: `${hours}h`,
      });
    } catch (error) {
      logger.error('Error in getDataStatistics:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/data/range
   * Get sensor data within date range
   */
  async getDataByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
        });
      }

      const data = await this.sensorDataService.getDataByDateRange(start, end);

      return res.json({
        success: true,
        data,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          count: data.length,
        },
      });
    } catch (error) {
      logger.error('Error in getDataByDateRange:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

module.exports = SensorDataController;
