/**
 * System Status Controller
 * Provides system health and status information
 */

const logger = require('../utils/logger');

class SystemController {
  constructor(mqttClient) {
    this.mqttClient = mqttClient;
  }

  /**
   * GET /api/status
   * Get system status
   */
  async getSystemStatus(req, res) {
    try {
      const status = {
        uptime: process.uptime(),
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        mqtt: this.mqttClient ? this.mqttClient.getStatus() : null,
        memory: process.memoryUsage(),
      };

      return res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error in getSystemStatus:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/health
   * Health check endpoint for load balancers
   */
  async healthCheck(req, res) {
    try {
      const mqttStatus = this.mqttClient?.getStatus();
      const isHealthy = mqttStatus?.isConnected;

      return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? 'healthy' : 'degraded',
        mqtt: isHealthy ? 'connected' : 'disconnected',
      });
    } catch (error) {
      logger.error('Error in healthCheck:', error.message);
      return res.status(503).json({
        success: false,
        status: 'error',
      });
    }
  }
}

module.exports = SystemController;
