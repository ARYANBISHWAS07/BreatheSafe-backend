/**
 * MQTT Client Manager
 * Handles MQTT broker connection, subscriptions, and message processing
 */

const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const logger = require('../utils/logger');
const DataQueue = require('../utils/dataQueue');

class MQTTClient {
  constructor(sensorDataService, alertsService, io = null) {
    this.client = null;
    this.sensorDataService = sensorDataService;
    this.alertsService = alertsService;
    this.io = io; // Socket.IO instance for real-time updates
    this.dataQueue = new DataQueue(parseInt(process.env.MAX_QUEUE_SIZE) || 1000);
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Connect to MQTT broker
   */
  connect() {
    try {
      logger.info('Connecting to MQTT broker...');

      const options = {
        ...mqttConfig.options,
        username: mqttConfig.broker.username,
        password: mqttConfig.broker.password,
      };

      this.client = mqtt.connect(mqttConfig.broker.url, options);

      // Connection event handlers
      this.client.on('connect', () => this.onConnect());
      this.client.on('message', (topic, message) => this.onMessage(topic, message));
      this.client.on('error', (error) => this.onError(error));
      this.client.on('close', () => this.onClose());
      this.client.on('offline', () => this.onOffline());
      this.client.on('reconnect', () => this.onReconnect());

      return this.client;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error connecting to MQTT:', errorMsg);
      throw error;
    }
  }

  /**
   * Handle MQTT connection
   */
  onConnect() {
    logger.info('✓ Connected to MQTT broker');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Subscribe to data topic
    this.subscribe(mqttConfig.topics.data);

    // Publish status
    this.publishStatus('online');

    // Process queued data
    this.processQueue();
  }

  /**
   * Subscribe to MQTT topic
   * @param {string} topic - Topic to subscribe to
   */
  subscribe(topic) {
    try {
      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error(`Failed to subscribe to ${topic}:`, errorMsg);
        } else {
          logger.info(`✓ Subscribed to topic: ${topic}`);
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error subscribing to topic:', errorMsg);
    }
  }

  /**
   * Handle incoming MQTT message
   * @param {string} topic - Topic the message came from
   * @param {Buffer} message - Message payload
   */
  onMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      logger.debug('MQTT message received', { topic, payload: JSON.stringify(payload) });

      // Process sensor data (async but don't await to keep handler non-blocking)
      this.processSensorMessage(payload).catch((err) => {
        logger.error('Unhandled error in processSensorMessage:', err instanceof Error ? err.message : String(err));
      });
    } catch (error) {
      logger.error('Error parsing MQTT message:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Process sensor data from MQTT
   * @param {object} payload - MQTT message payload
   */
  async processSensorMessage(payload) {
    console.log('[DEBUG] Starting processSensorMessage with payload:', JSON.stringify(payload));
    try {
      // Validate payload
      if (!payload || typeof payload !== 'object') {
        logger.warn('Invalid payload received:', payload);
        return;
      }

      // Map common device field aliases to canonical field names so the
      // analytics and storage layers always receive the expected keys.
      // This helps when devices use different naming conventions.
      const mapped = { ...payload };

      // Common alias: temp -> temperature
      if (mapped.temp !== undefined && mapped.temperature === undefined) {
        mapped.temperature = mapped.temp;
      }

      // Preserve the new gas score field while still backfilling legacy names.
      if (mapped.mq_score === undefined && mapped.mq135_ppm !== undefined) {
        mapped.mq_score = mapped.mq135_ppm;
      }
      if (mapped.mq_score !== undefined && mapped.mq135_ppm === undefined) {
        mapped.mq135_ppm = mapped.mq_score;
      }
      if (mapped.mq !== undefined && mapped.mq135_ppm === undefined) {
        mapped.mq135_ppm = mapped.mq;
      }
      if (mapped.mq !== undefined && mapped.mq_score === undefined) {
        mapped.mq_score = mapped.mq;
      }

      // Do not normalize timestamps here; `normalizeTimestamp` in the
      // analytics processor will handle seconds->ms conversion centrally.

      logger.debug('Processing payload (mapped):', JSON.stringify(mapped));

      // Process the data
      const processedData = await this.sensorDataService.processSensorData(mapped);

      if (!processedData) {
        logger.warn('Failed to process sensor data');
        return;
      }

      // Emit sensor data immediately so real-time updates are not blocked by persistence.
      if (this.io) {
        const { emitSensorUpdate } = require('../socketIO');
        emitSensorUpdate(this.io, processedData);
      }

      // Try to save immediately, queue if fails
      if (this.isConnected) {
        try {
          const savedData = await this.sensorDataService.saveSensorData(processedData);

          // Trigger alerts if needed and savedData has _id
          if (savedData && savedData._id) {
            await this.alertsService.triggerAlerts(processedData, savedData._id);
          }

          logger.info('✓ Sensor data processed and saved');
        } catch (dbError) {
          const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
          logger.warn('Failed to save to DB, queuing data:', errorMsg);
          this.dataQueue.enqueue(processedData);
        }
      } else {
        // Queue if not connected
        this.dataQueue.enqueue(processedData);
      }
    } catch (error) {
      try {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorType = error?.constructor?.name || 'Unknown';
        logger.error(`Error processing sensor message [${errorType}]: ${errorMsg}`);
        if (error instanceof Error && error.stack) {
          logger.debug('Error stack:', error.stack);
        }
      } catch (logError) {
        console.error('Failed to log error:', logError);
        console.error('Original error:', error);
      }
    }
  }

  /**
   * Process queued data when connection is restored
   */
  async processQueue() {
    if (this.dataQueue.size() === 0) {
      return;
    }

    logger.info(`Processing queued data: ${this.dataQueue.size()} items`);

    while (this.dataQueue.size() > 0 && this.isConnected) {
      const data = this.dataQueue.dequeue();

      if (!data) {
        continue;
      }

      try {
        const savedData = await this.sensorDataService.saveSensorData(data);

        if (savedData && savedData._id) {
          await this.alertsService.triggerAlerts(data, savedData._id);
        }
        
        logger.debug('✓ Queued data processed');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn('Failed to process queued data, re-queueing:', errorMsg);
        this.dataQueue.enqueue(data);
        break; // Stop processing if write fails
      }
    }
  }

  /**
   * Publish message to MQTT topic
   * @param {string} topic - Topic to publish to
   * @param {object} payload - Message payload
   */
  publish(topic, payload) {
    try {
      if (!this.isConnected) {
        logger.warn('Cannot publish, MQTT not connected');
        return false;
      }

      this.client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
        if (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error('Error publishing message:', errorMsg);
        }
      });

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error publishing to MQTT:', errorMsg);
      return false;
    }
  }

  /**
   * Publish status message
   * @param {string} status - Status (online/offline)
   */
  publishStatus(status) {
    this.publish(mqttConfig.topics.status, {
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Handle MQTT errors
   * @param {Error} error - Error object
   */
  onError(error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('MQTT error:', errorMsg);
  }

  /**
   * Handle MQTT close
   */
  onClose() {
    this.isConnected = false;
    logger.warn('MQTT connection closed');
  }

  /**
   * Handle MQTT offline
   */
  onOffline() {
    this.isConnected = false;
    logger.warn('MQTT offline');
  }

  /**
   * Handle MQTT reconnect
   */
  onReconnect() {
    this.reconnectAttempts++;
    logger.info(`MQTT reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached, giving up');
      this.disconnect();
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.publishStatus('offline');
      this.client.end(true, () => {
        logger.info('Disconnected from MQTT broker');
      });
    }
  }

  /**
   * Get MQTT connection status
   * @returns {boolean} - Connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      queueSize: this.dataQueue.size(),
      reconnectAttempts: this.reconnectAttempts,
      analytics: this.sensorDataService?.getExposureTracker?.() || null,
    };
  }
}

module.exports = MQTTClient;
