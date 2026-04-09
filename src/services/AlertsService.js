const logger = require('../utils/logger');
const Alert = require('../models/Alert');
const { determineAlertLevel } = require('../utils/analytics');
const mqttConfig = require('../config/mqtt');

class AlertsService {
  constructor(io, mqttClient = null) {
    this.io = io;
    this.mqttClient = mqttClient;
    this.alertCooldown = new Map();
    this.cooldownDuration = 300000;
  }

  checkAlertConditions(sensorData) {
    const level = determineAlertLevel(sensorData.uaqs, sensorData.cri);

    if (level === 'LOW') {
      return [];
    }

    return [{
      type: 'AIR_QUALITY_ALERT',
      level,
      uaqs: sensorData.uaqs,
      cri: sensorData.cri,
      pm25: sensorData.pm25,
      mq135_ppm: sensorData.mq135_ppm,
    }];
  }

  generateAlertMessage(alert) {
    const { level, uaqs, cri } = alert;

    if (level === 'HIGH') {
      return `High air-quality risk detected (UAQS: ${uaqs.toFixed(1)}, CRI: ${cri.toFixed(1)}).`;
    }

    return `Moderate air-quality risk detected (UAQS: ${uaqs.toFixed(1)}, CRI: ${cri.toFixed(1)}).`;
  }

  getDetailedRiskAssessment(sensorData) {
    const { uaqs, cri, alertLevel } = sensorData;

    if (alertLevel === 'HIGH') {
      return {
        healthImplication: `Current air conditions indicate elevated exposure risk (UAQS ${uaqs.toFixed(1)}, CRI ${cri.toFixed(1)}).`,
        recommendation: 'Reduce exposure immediately and improve ventilation or filtration.',
      };
    }

    return {
      healthImplication: `Air quality has moved into a cautionary range (UAQS ${uaqs.toFixed(1)}, CRI ${cri.toFixed(1)}).`,
      recommendation: 'Monitor conditions closely and limit prolonged exposure if sensitive.',
    };
  }

  isOnCooldown(alertKey) {
    const cooldownUntil = this.alertCooldown.get(alertKey);
    return cooldownUntil && cooldownUntil > Date.now();
  }

  setAlertCooldown(alertKey) {
    this.alertCooldown.set(alertKey, Date.now() + this.cooldownDuration);
  }

  async createAlert(alertData, sensorData = {}, sensorDataId = null) {
    try {
      const riskAssessment = this.getDetailedRiskAssessment(sensorData);
      const alert = new Alert({
        level: alertData.level,
        type: alertData.type,
        message: this.generateAlertMessage(alertData),
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
          timestamp: new Date(sensorData.timestamp),
        },
        exposureMetrics: {
          average_1h_UAQS: sensorData.average_1h_UAQS,
          average_3h_UAQS: sensorData.average_3h_UAQS,
          cumulativeExposure: sensorData.exposure,
        },
        riskAssessment: {
          healthImplication: riskAssessment.healthImplication,
          recommendation: riskAssessment.recommendation,
        },
        sensorDataId,
      });
      const savedAlert = await alert.save();
      logger.info(`Alert created: ${savedAlert.type} - Level: ${savedAlert.level}`);
      return savedAlert;
    } catch (error) {
      logger.error(`Error creating alert: ${error.message}`);
      throw error;
    }
  }

  async triggerAlerts(sensorData, sensorDataId = null) {
    try {
      sensorData.alertLevel = determineAlertLevel(sensorData.uaqs, sensorData.cri);
      const alertsToCheck = this.checkAlertConditions(sensorData);
      for (const alertData of alertsToCheck) {
        if (alertData.level === 'LOW') continue;
        const alertKey = alertData.type;
        if (this.isOnCooldown(alertKey)) {
          logger.debug(`Alert on cooldown: ${alertKey}`);
          continue;
        }
        const alert = await this.createAlert(alertData, sensorData, sensorDataId);
        this.setAlertCooldown(alertKey);
        
        // Emit via Socket.IO
        if (this.io) {
          this.io.emit('alert-triggered', {
            _id: alert._id,
            level: alert.level,
            type: alert.type,
            message: alert.message,
            createdAt: alert.createdAt,
            triggerValues: alert.triggerValues,
            riskAssessment: alert.riskAssessment,
          });
          logger.debug(`Alert emitted via Socket.IO: ${alert.type}`);
        }

        // Publish via MQTT
        this.publishAlertToMQTT(alert);
      }
    } catch (error) {
      logger.error(`Error triggering alerts: ${error.message}`);
    }
  }

  /**
   * Publish alert to MQTT topic
   * @param {object} alert - Alert document from database
   */
  publishAlertToMQTT(alert) {
    try {
      if (!this.mqttClient) {
        logger.warn('MQTT client not available, skipping alert publish');
        return;
      }

      const alertPayload = {
        _id: alert._id.toString(),
        level: alert.level,
        type: alert.type,
        message: alert.message,
        createdAt: alert.createdAt,
        triggerValues: {
          pm25: alert.triggerValues?.pm25,
          aqi: alert.triggerValues?.aqi,
          mq135_ppm: alert.triggerValues?.mq135_ppm,
          correctedPPM: alert.triggerValues?.correctedPPM,
          aci: alert.triggerValues?.aci,
          uaqs: alert.triggerValues?.uaqs,
          cri: alert.triggerValues?.cri,
          temperature: alert.triggerValues?.temperature,
          humidity: alert.triggerValues?.humidity,
        },
        riskAssessment: {
          healthImplication: alert.riskAssessment?.healthImplication,
          recommendation: alert.riskAssessment?.recommendation,
        },
      };

      const success = this.mqttClient.publish(
        mqttConfig.topics.alerts,
        alertPayload
      );

      if (success) {
        logger.info(`✓ Alert published to MQTT topic '${mqttConfig.topics.alerts}': ${alert.type} (${alert.level})`);
      } else {
        logger.warn(`Failed to publish alert to MQTT: ${alert.type}`);
      }
    } catch (error) {
      logger.error(`Error publishing alert to MQTT: ${error.message}`);
    }
  }

  async getRecentAlerts(limit = 50, unacknowledgedOnly = false) {
    try {
      const filter = unacknowledgedOnly ? { isAcknowledged: false } : {};
      const alerts = await Alert.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 500))
        .lean();
      return alerts;
    } catch (error) {
      logger.error(`Error fetching recent alerts: ${error.message}`);
      throw error;
    }
  }

  async acknowledgeAlert(alertId, acknowledgedBy = 'SYSTEM') {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        {
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy,
        },
        { new: true }
      );
      logger.info(`Alert acknowledged: ${alertId}`);
      return alert;
    } catch (error) {
      logger.error(`Error acknowledging alert: ${error.message}`);
      throw error;
    }
  }

  async getAlertStats(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const stats = await Alert.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
      ]);
      const byType = await Alert.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);
      const acknowledged = await Alert.countDocuments({
        createdAt: { $gte: since },
        isAcknowledged: true,
      });
      const unacknowledged = await Alert.countDocuments({
        createdAt: { $gte: since },
        isAcknowledged: false,
      });
      return {
        timeWindowHours: hours,
        byLevel: stats,
        byType: byType,
        acknowledged,
        unacknowledged,
        total: acknowledged + unacknowledged,
      };
    } catch (error) {
      logger.error(`Error fetching alert stats: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AlertsService;
