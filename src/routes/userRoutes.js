/**
 * User Routes
 * API endpoints for user management and classification
 */

const express = require('express');

const createUserRoutes = (userController) => {
  const router = express.Router();

  /**
   * POST /api/users
   * Create a new user with classification
   */
  router.post('/users', (req, res) => {
    userController.createUser(req, res);
  });

  /**
   * GET /api/users
   * Get all users with optional filtering
   */
  router.get('/users', (req, res) => {
    userController.getAllUsers(req, res);
  });

  /**
   * GET /api/users/classifications/available
   * Get all available classifications
   */
  router.get('/users/classifications/available', (req, res) => {
    userController.getAvailableClassifications(req, res);
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  router.get('/users/:id', (req, res) => {
    userController.getUser(req, res);
  });

  /**
   * GET /api/users/email/:email
   * Get user by email
   */
  router.get('/users/email/:email', (req, res) => {
    userController.getUserByEmail(req, res);
  });

  /**
   * GET /api/users/classification/:classification
   * Get users by classification
   */
  router.get('/users/classification/:classification', (req, res) => {
    userController.getUsersByClassification(req, res);
  });

  /**
   * PUT /api/users/:id
   * Update user
   */
  router.put('/users/:id', (req, res) => {
    userController.updateUser(req, res);
  });

  /**
   * PUT /api/users/:id/alert-preferences
   * Update alert preferences
   */
  router.put('/users/:id/alert-preferences', (req, res) => {
    userController.updateAlertPreferences(req, res);
  });

  /**
   * DELETE /api/users/:id
   * Delete user (soft delete)
   */
  router.delete('/users/:id', (req, res) => {
    userController.deleteUser(req, res);
  });

  /**
   * GET /api/users/thresholds/:classification
   * Get thresholds for a classification
   */
  router.get('/users/thresholds/:classification', (req, res) => {
    userController.getClassificationThresholds(req, res);
  });

  return router;
};

module.exports = createUserRoutes;
