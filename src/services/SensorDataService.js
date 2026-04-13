const logger = require('../utils/logger');
const SensorData = require('../models/SensorData');
const {
  AirQualityAnalyticsProcessor,
} = require('../utils/analytics');

class SensorDataService {
  constructor(healthAlertService = null) {
    this.analyticsProcessor = new AirQualityAnalyticsProcessor();
    this.lastProcessedData = null;
    this.healthAlertService = healthAlertService;
  }

  async processSensorData(sensorData) {
    try {
      if (!sensorData || typeof sensorData !== 'object') {
        throw new Error('Sensor payload must be an object');
      }

      const reading = {
        pm25: sensorData.pm25,
        aqi: sensorData.aqi,
        mq135_ppm: sensorData.mq135_ppm,
        mq_score: sensorData.mq_score,
        correctedPPM: sensorData.correctedPPM,
        aci: sensorData.aci,
        uaqs: sensorData.uaqs,
        cri: sensorData.cri,
        exposure: sensorData.exposure,
        humidity: sensorData.humidity,
        temperature: sensorData.temperature ?? sensorData.temp,
        timestamp: sensorData.timestamp,
      };

      const processedData = this.analyticsProcessor.processReading(reading);
      processedData.temp = processedData.temperature;
      this.lastProcessedData = processedData;
      return processedData;
    } catch (error) {
      logger.error(`Error processing sensor data: ${error.message}`);
      return null;
    }
  }

  async saveSensorData(processedData) {
    try {
      const sensorData = new SensorData({
        ...processedData,
        recordedAt: new Date(processedData.timestamp),
      });

      const saved = await sensorData.save();
      logger.info(`Sensor data saved: ${saved._id}`);

      // Trigger health alerts for all classifications
      if (this.healthAlertService) {
        const alerts = await this.healthAlertService.checkAndGenerateAlerts(
          processedData,
          saved._id
        );

        if (alerts && alerts.length > 0) {
          logger.info(`Generated ${alerts.length} health alerts`);
          
          // Emit alerts via Socket.IO
          for (const alert of alerts) {
            this.healthAlertService.emitAlertToClients(alert, alert.classification);
          }
        }
      }

      return saved;
    } catch (error) {
      logger.error(`Error saving sensor data: ${error.message}`);
      return null;
    }
  }

  async getLatestData() {
    try {
      return await SensorData.findOne().sort({ timestamp: -1 }).lean();
    } catch (error) {
      logger.error(`Error fetching latest data: ${error.message}`);
      throw error;
    }
  }

  async getDataHistory(limit = 100, skip = 0) {
    try {
      return await SensorData.find()
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 1000))
        .skip(skip)
        .lean();
    } catch (error) {
      logger.error(`Error fetching data history: ${error.message}`);
      throw error;
    }
  }

  async getDataStatistics(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const stats = await SensorData.aggregate([
        { $match: { recordedAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgPM25: { $avg: '$pm25' },
            maxPM25: { $max: '$pm25' },
            minPM25: { $min: '$pm25' },
            avgAQI: { $avg: '$aqi' },
            avgMQ135PPM: { $avg: '$mq135_ppm' },
            avgCorrectedPPM: { $avg: '$correctedPPM' },
            avgACI: { $avg: '$aci' },
            avgUAQS: { $avg: '$uaqs' },
            maxUAQS: { $max: '$uaqs' },
            avgCRI: { $avg: '$cri' },
            maxCRI: { $max: '$cri' },
            avgExposure: { $avg: '$exposure' },
            avgRolling1h: { $avg: '$average_1h_UAQS' },
            avgRolling3h: { $avg: '$average_3h_UAQS' },
            avgTemperature: { $avg: '$temperature' },
            avgHumidity: { $avg: '$humidity' },
          },
        },
      ]);

      if (stats.length === 0) {
        return {
          timeWindowHours: hours,
          count: 0,
          message: 'No data in time window',
        };
      }

      const data = stats[0];
      return {
        timeWindowHours: hours,
        count: data.count,
        pm25: {
          average: Math.round(data.avgPM25 * 100) / 100,
          max: Math.round(data.maxPM25 * 100) / 100,
          min: Math.round(data.minPM25 * 100) / 100,
        },
        aqi: {
          average: Math.round(data.avgAQI * 100) / 100,
        },
        mq135: {
          averagePPM: Math.round(data.avgMQ135PPM * 100) / 100,
          correctedPPM: Math.round(data.avgCorrectedPPM * 100) / 100,
          averageACI: Math.round(data.avgACI * 100) / 100,
        },
        uaqs: {
          average: Math.round(data.avgUAQS * 100) / 100,
          max: Math.round(data.maxUAQS * 100) / 100,
          rolling1hAverage: Math.round(data.avgRolling1h * 100) / 100,
          rolling3hAverage: Math.round(data.avgRolling3h * 100) / 100,
        },
        cri: {
          average: Math.round(data.avgCRI * 100) / 100,
          max: Math.round(data.maxCRI * 100) / 100,
        },
        exposure: {
          average: Math.round(data.avgExposure * 100) / 100,
        },
        environment: {
          averageTemperature: Math.round(data.avgTemperature * 100) / 100,
          averageHumidity: Math.round(data.avgHumidity * 100) / 100,
        },
      };
    } catch (error) {
      logger.error(`Error calculating statistics: ${error.message}`);
      throw error;
    }
  }

  async getDataByDateRange(startDate, endDate, limit = 500) {
    try {
      return await SensorData.find({
        recordedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 2000))
        .lean();
    } catch (error) {
      logger.error(`Error fetching data history: ${error.message}`);
      throw error;
    }
  }

  async getUAQSTrends(hours = 3) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const data = await SensorData.find({
        recordedAt: { $gte: since },
      })
        .sort({ timestamp: 1 })
        .select('uaqs cri timestamp')
        .lean();

      if (data.length < 2) {
        return { message: 'Insufficient data for trend analysis' };
      }

      const uaqsValues = data.map((entry) => entry.uaqs);
      const criValues = data.map((entry) => entry.cri);

      const uaqsSlope = this.calculateTrendSlope(uaqsValues);
      const criSlope = this.calculateTrendSlope(criValues);

      return {
        timeWindowHours: hours,
        dataPoints: data.length,
        uaqs: {
          current: uaqsValues[uaqsValues.length - 1],
          initial: uaqsValues[0],
          trend: uaqsSlope > 0.1 ? 'increasing' : uaqsSlope < -0.1 ? 'decreasing' : 'stable',
          slope: Math.round(uaqsSlope * 10000) / 10000,
        },
        cri: {
          current: criValues[criValues.length - 1],
          initial: criValues[0],
          trend: criSlope > 0.1 ? 'increasing' : criSlope < -0.1 ? 'decreasing' : 'stable',
          slope: Math.round(criSlope * 10000) / 10000,
        },
      };
    } catch (error) {
      logger.error(`Error calculating trends: ${error.message}`);
      throw error;
    }
  }

  calculateTrendSlope(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const xMean = xSum / n;
    const yMean = values.reduce((sum, value) => sum + value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let index = 0; index < n; index += 1) {
      numerator += (index - xMean) * (values[index] - yMean);
      denominator += (index - xMean) * (index - xMean);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const result = await SensorData.deleteMany({ recordedAt: { $lt: cutoffDate } });

      logger.info(`Deleted ${result.deletedCount} old sensor records`);
      return {
        deletedCount: result.deletedCount,
        cutoffDate,
        daysRetained: daysToKeep,
      };
    } catch (error) {
      logger.error(`Error cleaning up old data: ${error.message}`);
      throw error;
    }
  }

  getExposureTracker() {
    return this.analyticsProcessor.getState();
  }

  resetExposureTracker() {
    this.analyticsProcessor.reset();
    logger.info('Analytics state reset');
  }

  setHealthAlertService(healthAlertService) {
    this.healthAlertService = healthAlertService;
  }
}

module.exports = SensorDataService;
