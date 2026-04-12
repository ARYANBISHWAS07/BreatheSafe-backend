/**
 * Health Alert Service
 * Generates classification-specific alerts based on threshold breaches
 */

const logger = require('../utils/logger');
const Alert = require('../models/Alert');
const User = require('../models/User');
const {
  determineAlertLevelByClassification,
  getAvailableClassifications
} = require('../utils/healthThresholds');
const {
  generateHealthAlert,
  getAlertTitle
} = require('../utils/healthEffects');

class HealthAlertService {
  constructor(io = null) {
    this.io = io;
    this.alertCooldown = new Map(); // Prevent alert spam
    this.cooldownDuration = 300000; // 5 minutes
  }

  /**
   * Check sensor data against all user classifications and generate alerts
   * @param {object} sensorData - Current sensor data
   * @param {string} sensorDataId - MongoDB ID of sensor data
   * @returns {array} Array of generated alerts
   */
  async checkAndGenerateAlerts(sensorData, sensorDataId = null) {
    try {
      const generatedAlerts = [];
      const classifications = getAvailableClassifications();

      for (const classification of classifications) {
        const alertData = await this.generateAlertForClassification(
          classification,
          sensorData,
          sensorDataId
        );

        if (alertData) {
          generatedAlerts.push(alertData);
        }
      }

      return generatedAlerts;
    } catch (error) {
      logger.error(`Error in checkAndGenerateAlerts: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate alert for specific classification
   * @param {string} classification - User classification
   * @param {object} sensorData - Sensor data
   * @param {string} sensorDataId - MongoDB ID of sensor data
   * @returns {object} Alert data or null if no alert needed
   */
  async generateAlertForClassification(classification, sensorData, sensorDataId = null) {
    try {
      const assessment = determineAlertLevelByClassification(classification, sensorData);

      // Don't create alert if no threshold breached
      if (assessment.level === 'NONE' || assessment.level === 'LOW') {
        return null;
      }

      // Check cooldown to prevent spam
      const cooldownKey = `${classification}`;
      if (this.isOnCooldown(cooldownKey)) {
        logger.debug(`Alert on cooldown for classification: ${classification}`);
        return null;
      }

      // Generate health effects information
      const healthAlert = generateHealthAlert(classification, assessment.breachedThresholds);

      if (!healthAlert) {
        return null;
      }

      // Create alert in database
      const alert = await this.createHealthAlert(
        classification,
        assessment,
        healthAlert,
        sensorData,
        sensorDataId
      );

      if (alert) {
        this.setAlertCooldown(cooldownKey);
        return alert;
      }

      return null;
    } catch (error) {
      logger.error(`Error generating alert for ${classification}: ${error.message}`);
      return null;
    }
  }

  /**
   * Create and save health alert to database
   * @param {string} classification - User classification
   * @param {object} assessment - Alert assessment data
   * @param {object} healthAlert - Health alert details
   * @param {object} sensorData - Sensor data
   * @param {string} sensorDataId - MongoDB ID of sensor data
   * @returns {object} Created alert document
   */
  async createHealthAlert(classification, assessment, healthAlert, sensorData, sensorDataId = null) {
    try {
      const alertTitle = getAlertTitle(classification, healthAlert.metric, healthAlert.severity);

      const alert = new Alert({
        level: assessment.level,
        type: 'HEALTH_ALERT',
        classification,
        classificationDisplayName: healthAlert.classificationDisplayName,
        title: alertTitle,
        message: healthAlert.healthImplication,
        recommendations: healthAlert.recommendations,
        potentialHealthEffects: healthAlert.potentialEffects,
        breachedMetrics: healthAlert.breachedMetrics,
        triggerValues: {
          pm25: sensorData.pm25,
          aqi: sensorData.aqi,
          mq135_ppm: sensorData.mq135_ppm,
          correctedPPM: sensorData.correctedPPM,
          aci: sensorData.aci,
          uaqs: sensorData.uaqs,
          cri: sensorData.cri,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          timestamp: sensorData.timestamp || Date.now()
        },
        exposureMetrics: {
          average_1h_UAQS: sensorData.average_1h_UAQS,
          average_3h_UAQS: sensorData.average_3h_UAQS,
          cumulativeExposure: sensorData.exposure
        },
        riskAssessment: {
          healthImplication: healthAlert.healthImplication,
          recommendation: healthAlert.recommendations,
          affectedClassification: healthAlert.classificationDisplayName
        },
        sensorDataId: sensorDataId || null,
        createdAt: new Date()
      });

      const savedAlert = await alert.save();
      logger.info(`Health alert created for ${classification}: ${savedAlert._id}`);

      return savedAlert;
    } catch (error) {
      logger.error(`Error creating health alert: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if alert is on cooldown
   * @param {string} key - Cooldown key
   * @returns {boolean} True if on cooldown
   */
  isOnCooldown(key) {
    const cooldownUntil = this.alertCooldown.get(key);
    return cooldownUntil && cooldownUntil > Date.now();
  }

  /**
   * Set alert cooldown
   * @param {string} key - Cooldown key
   */
  setAlertCooldown(key) {
    this.alertCooldown.set(key, Date.now() + this.cooldownDuration);
  }

  /**
   * Clear cooldown for testing
   * @param {string} key - Cooldown key (optional, clears all if not provided)
   */
  clearCooldown(key = null) {
    if (key) {
      this.alertCooldown.delete(key);
    } else {
      this.alertCooldown.clear();
    }
  }

  /**
   * Get recent alerts for a specific classification
   * @param {string} classification - User classification
   * @param {number} limit - Max alerts to retrieve
   * @returns {array} Array of alert documents
   */
  async getAlertsForClassification(classification, limit = 50) {
    try {
      const alerts = await Alert.find({
        classification,
        type: 'HEALTH_ALERT'
      })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 500))
        .lean();

      return alerts;
    } catch (error) {
      logger.error(`Error fetching alerts for ${classification}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get alerts for specific user
   * @param {string} userId - User ID
   * @param {number} limit - Max alerts
   * @returns {array} Array of alerts
   */
  async getAlertsForUser(userId, limit = 50) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.getAlertsForClassification(user.classification, limit);
    } catch (error) {
      logger.error(`Error fetching alerts for user ${userId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get unacknowledged alerts for classification
   * @param {string} classification - User classification
   * @param {number} limit - Max alerts
   * @returns {array} Array of unacknowledged alerts
   */
  async getUnacknowledgedAlertsForClassification(classification, limit = 50) {
    try {
      const alerts = await Alert.find({
        classification,
        type: 'HEALTH_ALERT',
        isAcknowledged: false
      })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 500))
        .lean();

      return alerts;
    } catch (error) {
      logger.error(`Error fetching unacknowledged alerts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get alerts by severity level for classification
   * @param {string} classification - User classification
   * @param {string} level - Alert level (LOW, MODERATE, HIGH)
   * @param {number} limit - Max alerts
   * @returns {array} Array of alerts
   */
  async getAlertsByLevelForClassification(classification, level, limit = 50) {
    try {
      const alerts = await Alert.find({
        classification,
        type: 'HEALTH_ALERT',
        level
      })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 500))
        .lean();

      return alerts;
    } catch (error) {
      logger.error(`Error fetching alerts by level: ${error.message}`);
      return [];
    }
  }

  /**
   * Get alert statistics for a classification
   * @param {string} classification - User classification
   * @param {number} hours - Time period in hours
   * @returns {object} Statistics
   */
  async getAlertStatsForClassification(classification, hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const stats = await Alert.aggregate([
        {
          $match: {
            classification,
            type: 'HEALTH_ALERT',
            createdAt: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
            alertsByMetric: {
              $push: {
                metric: { $arrayElemAt: ['$breachedMetrics.metric', 0] },
                value: { $arrayElemAt: ['$breachedMetrics.value', 0] }
              }
            }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);

      const totalAlerts = await Alert.countDocuments({
        classification,
        type: 'HEALTH_ALERT',
        createdAt: { $gte: since }
      });

      const acknowledgedAlerts = await Alert.countDocuments({
        classification,
        type: 'HEALTH_ALERT',
        isAcknowledged: true,
        createdAt: { $gte: since }
      });

      return {
        classification,
        period: `${hours} hours`,
        totalAlerts,
        acknowledgedAlerts,
        unacknowledgedAlerts: totalAlerts - acknowledgedAlerts,
        alertsByLevel: stats
      };
    } catch (error) {
      logger.error(`Error getting alert stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} acknowledgedBy - Who acknowledged (user ID or system)
   * @returns {object} Updated alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy = 'SYSTEM') {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        {
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy
        },
        { new: true }
      );

      if (!alert) {
        throw new Error('Alert not found');
      }

      logger.info(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
      return alert;
    } catch (error) {
      logger.error(`Error acknowledging alert: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emit alert via Socket.IO to connected clients
   * @param {object} alert - Alert document
   * @param {string} classification - User classification
   */
  emitAlertToClients(alert, classification) {
    if (!this.io) {
      logger.debug('Socket.IO not configured for alert emission');
      return;
    }

    try {
      // Emit to all clients in classification room
      this.io.to(`classification_${classification}`).emit('health_alert', {
        id: alert._id,
        classification: alert.classification,
        level: alert.level,
        title: alert.title,
        message: alert.message,
        recommendations: alert.recommendations,
        potentialEffects: alert.potentialHealthEffects,
        breachedMetrics: alert.breachedMetrics,
        createdAt: alert.createdAt
      });

      logger.debug(`Alert emitted to classification_${classification}`);
    } catch (error) {
      logger.error(`Error emitting alert: ${error.message}`);
    }
  }

  /**
   * Set SocketIO instance
   * @param {object} io - Socket.IO instance
   */
  setIO(io) {
    this.io = io;
  }
}

module.exports = HealthAlertService;
