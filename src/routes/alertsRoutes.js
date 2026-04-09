/**
 * Alerts Routes
 * API endpoints for alerts operations
 */

const express = require('express');

const createAlertsRoutes = (alertsController) => {
  const router = express.Router();

  /**
   * GET /api/alerts
   * Get alert history
   * Query params: limit (default: 50), unacknowledged (default: false)
   */
  router.get('/alerts', (req, res) => {
    alertsController.getAlerts(req, res);
  });

  /**
   * POST /api/alerts/:id/acknowledge
   * Acknowledge an alert
   */
  router.post('/alerts/:id/acknowledge', (req, res) => {
    alertsController.acknowledgeAlert(req, res);
  });

  /**
   * GET /api/alerts/stats
   * Get alert statistics
   * Query params: hours (default: 24)
   */
  router.get('/alerts/stats', (req, res) => {
    alertsController.getAlertStats(req, res);
  });

  return router;
};

module.exports = createAlertsRoutes;
