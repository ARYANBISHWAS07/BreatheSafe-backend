/**
 * Example Client - Node.js
 * Demonstrates how to connect and use the Air Quality Monitoring System API
 */

const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

/**
 * REST API Client
 */
class AirQualityClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getLatestData() {
    try {
      const response = await axios.get(`${this.baseUrl}/data`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching latest data:', error.message);
      throw error;
    }
  }

  async getHistory(limit = 100, skip = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/history?limit=${limit}&skip=${skip}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching history:', error.message);
      throw error;
    }
  }

  async getStatistics(hours = 24) {
    try {
      const response = await axios.get(`${this.baseUrl}/statistics?hours=${hours}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching statistics:', error.message);
      throw error;
    }
  }

  async getAlerts(limit = 50, unacknowledged = false) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/alerts?limit=${limit}&unacknowledged=${unacknowledged}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching alerts:', error.message);
      throw error;
    }
  }

  async acknowledgeAlert(alertId, acknowledgedBy = 'system') {
    try {
      const response = await axios.post(`${this.baseUrl}/alerts/${alertId}/acknowledge`, {
        acknowledgedBy,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error acknowledging alert:', error.message);
      throw error;
    }
  }

  async getSystemStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching system status:', error.message);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error.message);
      throw error;
    }
  }
}

/**
 * WebSocket Real-time Client
 */
class RealtimeAirQualityClient {
  constructor(url = 'http://localhost:3000') {
    this.socket = io(url);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✓ Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
    });

    this.socket.on('connection-confirmation', (data) => {
      console.log('Connection confirmed:', data.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  subscribeSensorUpdates(callback) {
    this.socket.emit('subscribe-sensor-updates');
    this.socket.on('sensor-update', (data) => {
      callback(data);
    });
  }

  subscribeAlerts(callback) {
    this.socket.emit('subscribe-alerts');
    this.socket.on('alert-triggered', (data) => {
      callback(data);
    });
  }

  subscribeSystemStatus(callback) {
    this.socket.on('system-status', (data) => {
      callback(data);
    });
  }

  unsubscribe(channel) {
    this.socket.emit('unsubscribe', channel);
  }

  disconnect() {
    this.socket.disconnect();
  }
}

/**
 * Main example usage
 */
async function main() {
  console.log('🌍 Air Quality Monitoring System - Client Example');
  console.log('================================================\n');

  // Create REST client
  const restClient = new AirQualityClient();

  // Test REST API
  try {
    console.log('📊 Fetching latest sensor data...');
    const latest = await restClient.getLatestData();
    console.log('Latest Data:', {
      pm25: latest.pm25,
      aqi: latest.aqi,
      aqiCategory: latest.aqiCategory,
      cri: latest.cri,
      timestamp: latest.recordedAt,
    });
    console.log('');

    console.log('📈 Fetching 24-hour statistics...');
    const stats = await restClient.getStatistics(24);
    console.log('Statistics:', {
      avgPM25: stats.avgPM25.toFixed(1),
      maxPM25: stats.maxPM25.toFixed(1),
      avgAQI: stats.avgAQI.toFixed(0),
      totalReadings: stats.count,
    });
    console.log('');

    console.log('🚨 Fetching alerts...');
    const alerts = await restClient.getAlerts(10, true);
    console.log(`Found ${alerts.length} unacknowledged alerts`);
    if (alerts.length > 0) {
      console.log('Recent alert:', {
        type: alerts[0].type,
        level: alerts[0].level,
        message: alerts[0].message,
      });
    }
    console.log('');

    console.log('💚 System health check...');
    const health = await restClient.checkHealth();
    console.log('Health:', health);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Setup real-time client
  console.log('🔌 Connecting to real-time updates...');
  const realtimeClient = new RealtimeAirQualityClient();

  // Listen to sensor updates
  realtimeClient.subscribeSensorUpdates((data) => {
    console.log('📡 New sensor reading:', {
      pm25: data.data.pm25,
      aqi: data.data.aqi,
      timestamp: data.timestamp,
    });
  });

  // Listen to alerts
  realtimeClient.subscribeAlerts((data) => {
    console.log('🚨 ALERT:', {
      level: data.alert.level,
      type: data.alert.type,
      message: data.alert.message,
    });
  });

  // Listen to system status
  realtimeClient.subscribeSystemStatus((data) => {
    console.log('📊 System status:', {
      uptime: data.status.uptime,
      mqttConnected: data.status.mqtt.isConnected,
      queueSize: data.status.mqtt.queueSize,
    });
  });

  // Keep connection alive
  console.log('\nListening for real-time updates (press Ctrl+C to exit)...\n');
}

// Run example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AirQualityClient, RealtimeAirQualityClient };
