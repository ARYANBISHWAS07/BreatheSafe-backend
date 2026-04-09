/**
 * System Routes
 * API endpoints for system status
 */

const express = require('express');

const createSystemRoutes = (systemController) => {
  const router = express.Router();

  /**
   * GET /api/status
   * Get detailed system status
   */
  router.get('/status', (req, res) => {
    systemController.getSystemStatus(req, res);
  });

  /**
   * GET /api/health
   * Health check endpoint for load balancers
   */
  router.get('/health', (req, res) => {
    systemController.healthCheck(req, res);
  });

  return router;
};

module.exports = createSystemRoutes;
