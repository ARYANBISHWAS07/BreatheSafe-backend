/**
 * Alerts Controller
 * Handles HTTP requests for alerts
 */

const logger = require('../utils/logger');

class AlertsController {
  constructor(alertsService) {
    this.alertsService = alertsService;
  }

  /**
   * GET /api/alerts
   * Get alert history with optional filtering
   */
  async getAlerts(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 500);
      const unacknowledgedOnly = req.query.unacknowledged === 'true';

      const alerts = await this.alertsService.getRecentAlerts(limit, unacknowledgedOnly);

      return res.json({
        success: true,
        data: alerts,
        filter: {
          limit,
          unacknowledgedOnly,
        },
      });
    } catch (error) {
      logger.error('Error in getAlerts:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /api/alerts/:id/acknowledge
   * Acknowledge an alert
   */
  async acknowledgeAlert(req, res) {
    try {
      const { id } = req.params;
      const { acknowledgedBy } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Alert ID is required',
        });
      }

      const alert = await this.alertsService.acknowledgeAlert(
        id,
        acknowledgedBy || 'SYSTEM'
      );

      return res.json({
        success: true,
        data: alert,
        message: 'Alert acknowledged',
      });
    } catch (error) {
      logger.error('Error in acknowledgeAlert:', error.message);

      if (error.message === 'Alert not found') {
        return res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/alerts/stats
   * Get alert statistics
   */
  async getAlertStats(req, res) {
    try {
      const hours = Math.min(parseInt(req.query.hours) || 24, 720);
      const stats = await this.alertsService.getAlertStats(hours);

      return res.json({
        success: true,
        data: stats,
        period: `${hours}h`,
      });
    } catch (error) {
      logger.error('Error in getAlertStats:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

module.exports = AlertsController;
