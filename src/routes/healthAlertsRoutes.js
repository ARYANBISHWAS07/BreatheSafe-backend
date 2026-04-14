/**
 * Health Alerts Routes
 * API endpoints for classification-specific health alerts
 */

const express = require('express');

const createHealthAlertsRoutes = (healthAlertsController) => {
  const router = express.Router();

  /**
   * GET /api/health-alerts
   * Get health alerts with optional filtering
   */
  router.get('/health-alerts', (req, res) => {
    healthAlertsController.getHealthAlerts(req, res);
  });

  /**
   * GET /api/health-alerts/:id
   * Get health alert by ID
   */
  router.get('/health-alerts/:id', (req, res) => {
    healthAlertsController.getHealthAlert(req, res);
  });

  /**
   * POST /api/health-alerts/:id/acknowledge
   * Acknowledge a health alert
   */
  router.post('/health-alerts/:id/acknowledge', (req, res) => {
    healthAlertsController.acknowledgeHealthAlert(req, res);
  });

  /**
   * GET /api/health-alerts/stats/:classification
   * Get stats for a classification
   */
  router.get('/health-alerts/stats/:classification', (req, res) => {
    healthAlertsController.getHealthAlertStats(req, res);
  });

  /**
   * GET /api/health-alerts/classification/:classification/unacknowledged
   * Get unacknowledged alerts for classification
   */
  router.get('/health-alerts/classification/:classification/unacknowledged', (req, res) => {
    healthAlertsController.getUnacknowledgedAlerts(req, res);
  });

  return router;
};

module.exports = createHealthAlertsRoutes;
