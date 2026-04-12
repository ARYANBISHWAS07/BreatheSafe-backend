/**
 * User Controller
 * Handles HTTP requests for user management and classification
 */

const logger = require('../utils/logger');
const User = require('../models/User');
const { getAvailableClassifications, getClassificationThresholds } = require('../utils/healthThresholds');

class UserController {
  /**
   * Create a new user
   * POST /api/users
   */
  async createUser(req, res) {
    try {
      const { name, email, classification, age, location, alertPreferences } = req.body;

      // Validate required fields
      if (!name || !email || !classification) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and classification are required'
        });
      }

      // Validate classification
      const validClassifications = getAvailableClassifications();
      if (!validClassifications.includes(classification)) {
        return res.status(400).json({
          success: false,
          error: `Invalid classification. Valid options: ${validClassifications.join(', ')}`
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        classification,
        age,
        location,
        alertPreferences: alertPreferences || {
          enableEmailAlerts: true,
          enablePushAlerts: true,
          enableSMSAlerts: false,
          alertOnlyWhenThresholdBreached: true,
          alertLevels: ['MODERATE', 'HIGH']
        }
      });

      const savedUser = await user.save();
      logger.info(`User created: ${savedUser._id} with classification: ${classification}`);

      return res.status(201).json({
        success: true,
        data: savedUser,
        message: 'User created successfully'
      });
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Error fetching user: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get user by email
   * GET /api/users/email/:email
   */
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Error fetching user: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all users
   * GET /api/users
   */
  async getAllUsers(req, res) {
    try {
      const { classification, isActive } = req.query;
      let query = {};

      if (classification) {
        query.classification = classification;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const users = await User.find(query).sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error(`Error fetching users: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get users by classification
   * GET /api/users/classification/:classification
   */
  async getUsersByClassification(req, res) {
    try {
      const { classification } = req.params;

      // Validate classification
      const validClassifications = getAvailableClassifications();
      if (!validClassifications.includes(classification)) {
        return res.status(400).json({
          success: false,
          error: `Invalid classification. Valid options: ${validClassifications.join(', ')}`
        });
      }

      const users = await User.find({
        classification,
        isActive: true
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        classification,
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error(`Error fetching users by classification: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, classification, age, location, alertPreferences, isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Validate classification if provided
      if (classification) {
        const validClassifications = getAvailableClassifications();
        if (!validClassifications.includes(classification)) {
          return res.status(400).json({
            success: false,
            error: `Invalid classification. Valid options: ${validClassifications.join(', ')}`
          });
        }
        user.classification = classification;
      }

      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (age !== undefined) user.age = age;
      if (location) user.location = location;
      if (isActive !== undefined) user.isActive = isActive;
      if (alertPreferences) {
        user.alertPreferences = {
          ...user.alertPreferences.toObject(),
          ...alertPreferences
        };
      }

      user.updatedAt = new Date();
      const updatedUser = await user.save();

      logger.info(`User updated: ${updatedUser._id}`);

      return res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/users/:id
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.isActive = false;
      user.deletedAt = new Date();
      await user.save();

      logger.info(`User deleted (soft): ${id}`);

      return res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get classification thresholds
   * GET /api/users/thresholds/:classification
   */
  async getClassificationThresholds(req, res) {
    try {
      const { classification } = req.params;

      // Validate classification
      const validClassifications = getAvailableClassifications();
      if (!validClassifications.includes(classification)) {
        return res.status(400).json({
          success: false,
          error: `Invalid classification. Valid options: ${validClassifications.join(', ')}`
        });
      }

      const thresholds = getClassificationThresholds(classification);

      return res.json({
        success: true,
        classification,
        thresholds
      });
    } catch (error) {
      logger.error(`Error fetching thresholds: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all available classifications
   * GET /api/users/classifications/available
   */
  async getAvailableClassifications(req, res) {
    try {
      const classifications = getAvailableClassifications();

      return res.json({
        success: true,
        classifications,
        count: classifications.length
      });
    } catch (error) {
      logger.error(`Error fetching classifications: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update alert preferences
   * PUT /api/users/:id/alert-preferences
   */
  async updateAlertPreferences(req, res) {
    try {
      const { id } = req.params;
      const alertPreferences = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.alertPreferences = {
        ...user.alertPreferences.toObject(),
        ...alertPreferences
      };

      const updatedUser = await user.save();

      logger.info(`Alert preferences updated for user: ${id}`);

      return res.json({
        success: true,
        data: updatedUser.alertPreferences,
        message: 'Alert preferences updated successfully'
      });
    } catch (error) {
      logger.error(`Error updating alert preferences: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = UserController;
