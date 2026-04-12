/**
 * Health Alerts Controller
 * Handles HTTP requests for health-based alerts
 */

const logger = require('../utils/logger');

class HealthAlertsController {
  constructor(healthAlertService) {
    this.healthAlertService = healthAlertService;
  }

  /**
   * GET /api/health-alerts
   * Get health alerts with optional filtering
   */
  async getHealthAlerts(req, res) {
    try {
      const {
        classification,
        limit = 50,
        level,
        unacknowledged = false
      } = req.query;

      let alerts = [];

      if (classification) {
        if (unacknowledged === 'true') {
          alerts = await this.healthAlertService.getUnacknowledgedAlertsForClassification(
            classification,
            Math.min(parseInt(limit), 500)
          );
        } else if (level) {
          alerts = await this.healthAlertService.getAlertsByLevelForClassification(
            classification,
            level,
            Math.min(parseInt(limit), 500)
          );
        } else {
          alerts = await this.healthAlertService.getAlertsForClassification(
            classification,
            Math.min(parseInt(limit), 500)
          );
        }
      }

      return res.json({
        success: true,
        data: alerts,
        filter: {
          classification,
          limit: Math.min(parseInt(limit), 500),
          level,
          unacknowledged: unacknowledged === 'true'
        }
      });
    } catch (error) {
      logger.error(`Error in getHealthAlerts: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/health-alerts/:id
   * Get health alert by ID
   */
  async getHealthAlert(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Alert ID is required'
        });
      }

      // This would require adding to HealthAlertService if needed
      return res.json({
        success: true,
        message: 'Alert retrieval by ID not yet implemented'
      });
    } catch (error) {
      logger.error(`Error in getHealthAlert: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/health-alerts/:id/acknowledge
   * Acknowledge a health alert
   */
  async acknowledgeHealthAlert(req, res) {
    try {
      const { id } = req.params;
      const { acknowledgedBy } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Alert ID is required'
        });
      }

      const alert = await this.healthAlertService.acknowledgeAlert(
        id,
        acknowledgedBy || 'SYSTEM'
      );

      return res.json({
        success: true,
        data: alert,
        message: 'Health alert acknowledged'
      });
    } catch (error) {
      logger.error(`Error in acknowledgeHealthAlert: ${error.message}`);

      if (error.message === 'Alert not found') {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/health-alerts/stats/:classification
   * Get health alert statistics for a classification
   */
  async getHealthAlertStats(req, res) {
    try {
      const { classification } = req.params;
      const { hours = 24 } = req.query;

      if (!classification) {
        return res.status(400).json({
          success: false,
          error: 'Classification is required'
        });
      }

      const stats = await this.healthAlertService.getAlertStatsForClassification(
        classification,
        parseInt(hours)
      );

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Classification not found'
        });
      }

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error in getHealthAlertStats: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/health-alerts/by-user/:userId
   * Get health alerts for specific user
   */
  async getAlertsForUser(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const alerts = await this.healthAlertService.getAlertsForUser(
        userId,
        Math.min(parseInt(limit), 500)
      );

      return res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error(`Error in getAlertsForUser: ${error.message}`);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/health-alerts/classification/:classification/unacknowledged
   * Get unacknowledged alerts for classification
   */
  async getUnacknowledgedAlerts(req, res) {
    try {
      const { classification } = req.params;
      const { limit = 50 } = req.query;

      if (!classification) {
        return res.status(400).json({
          success: false,
          error: 'Classification is required'
        });
      }

      const alerts = await this.healthAlertService.getUnacknowledgedAlertsForClassification(
        classification,
        Math.min(parseInt(limit), 500)
      );

      return res.json({
        success: true,
        data: alerts,
        classification,
        count: alerts.length
      });
    } catch (error) {
      logger.error(`Error in getUnacknowledgedAlerts: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = HealthAlertsController;
