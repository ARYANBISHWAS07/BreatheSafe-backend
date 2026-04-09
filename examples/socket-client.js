/**
 * Socket.IO Client Example
 * Demonstrates how to connect to the Air Quality Monitoring System
 * using Socket.IO for real-time data instead of HTTP polling
 * 
 * Run with: node examples/socket-client.js
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

class AirQualityClient {
  constructor(url = SERVER_URL) {
    this.url = url;
    this.socket = null;
    this.subscriptions = {
      sensorUpdates: false,
      alerts: false,
    };
  }

  /**
   * Connect to the Air Quality Monitoring System
   */
  connect() {
    console.log(`[INFO] Connecting to ${this.url}...`);

    this.socket = io(this.url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log(`[✓] Connected to server (Socket ID: ${this.socket.id})`);
    });

    this.socket.on('connection-confirmation', (data) => {
      console.log('[✓] Connection confirmed:', data.message);
      console.log(`[✓] Timestamp: ${data.timestamp}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[!] Disconnected from server: ${reason}`);
    });

    this.socket.on('error', (error) => {
      console.error('[✗] Socket error:', error);
    });

    this.socket.on('reconnect', () => {
      console.log('[✓] Reconnected to server');
      // Re-subscribe if previously subscribed
      if (this.subscriptions.sensorUpdates) {
        this.subscribeSensorUpdates();
      }
      if (this.subscriptions.alerts) {
        this.subscribeAlerts();
      }
    });

    // Subscription confirmations
    this.socket.on('subscription-confirmed', (data) => {
      console.log(`[✓] Subscribed to: ${data.channel}`);
      console.log(`    Message: ${data.message}`);
    });

    this.socket.on('unsubscription-confirmed', (data) => {
      console.log(`[✓] Unsubscribed from: ${data.channel}`);
    });

    // Real-time sensor data updates
    this.socket.on('sensor-update', (payload) => {
      const { timestamp, data } = payload;
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[📊] SENSOR UPDATE');
      console.log(`    Time: ${new Date(timestamp).toLocaleTimeString()}`);
      console.log(`    PM2.5: ${data.pm25.toFixed(2)} µg/m³ (${data.aqiCategory})`);
      console.log(`    MQ135: ${data.mq135PPM.toFixed(2)} PPM (ACI: ${data.aci.toFixed(1)})`);
      console.log(`    Temperature: ${data.temperature.toFixed(1)}°C`);
      console.log(`    Humidity: ${data.humidity.toFixed(1)}%`);
      console.log(`    UAQS: ${data.uaqs.toFixed(2)}`);
      console.log(`    UCRI: ${data.ucri.toFixed(2)}`);
      if (data.exposure1h !== undefined) {
        console.log(`    Exposure (1h): ${data.exposure1h.toFixed(2)}`);
        console.log(`    Exposure (3h): ${data.exposure3h.toFixed(2)}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Real-time alert notifications
    this.socket.on('alert-triggered', (payload) => {
      const { timestamp, alert } = payload;
      const levelIcon = alert.level === 'HIGH' ? '🚨' : '⚠️';
      console.log('\n╔═══════════════════════════════════════════════╗');
      console.log(`║ ${levelIcon} ALERT: ${alert.type}`);
      console.log(`║ Level: ${alert.level}`);
      console.log(`║ Time: ${new Date(timestamp).toLocaleTimeString()}`);
      console.log('╠═══════════════════════════════════════════════╣');
      console.log(`║ ${alert.message}`);
      console.log('║');
      console.log(`║ Values:`);
      console.log(`║   - PM2.5: ${alert.triggerValues.pm25.toFixed(2)} µg/m³`);
      console.log(`║   - MQ135: ${alert.triggerValues.mq135PPM.toFixed(2)} PPM`);
      console.log(`║   - UAQS: ${alert.triggerValues.uaqs.toFixed(2)}`);
      console.log(`║   - UCRI: ${alert.triggerValues.ucri.toFixed(2)}`);
      console.log('╚═══════════════════════════════════════════════╝\n');
    });

    // System status updates
    this.socket.on('system-status', (payload) => {
      const { status } = payload;
      console.log('[📡] System Status:');
      console.log(`    MQTT Connected: ${status.mqtt.connected}`);
      console.log(`    Memory: ${(status.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`    Uptime: ${Math.floor(status.uptime / 60)}m ${Math.floor(status.uptime % 60)}s`);
    });
  }

  /**
   * Subscribe to sensor updates
   */
  subscribeSensorUpdates() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-sensor-updates');
      this.subscriptions.sensorUpdates = true;
      console.log('[📤] Subscribing to sensor updates...');
    }
  }

  /**
   * Subscribe to alerts
   */
  subscribeAlerts() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-alerts');
      this.subscriptions.alerts = true;
      console.log('[📤] Subscribing to alerts...');
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe', channel);
      if (channel === 'sensor-updates') {
        this.subscriptions.sensorUpdates = false;
      } else if (channel === 'alerts') {
        this.subscriptions.alerts = false;
      }
      console.log(`[📤] Unsubscribing from ${channel}...`);
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('[!] Disconnected from server');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const client = new AirQualityClient();

  // Connect to server
  client.connect();

  // Give the socket time to connect
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Subscribe to both sensor updates and alerts
  client.subscribeSensorUpdates();
  client.subscribeAlerts();

  // Keep the client running
  console.log('[INFO] Client running. Press Ctrl+C to stop.\n');

  // Optional: Unsubscribe after 5 minutes
  // setTimeout(() => {
  //   client.unsubscribe('sensor-updates');
  //   client.unsubscribe('alerts');
  //   setTimeout(() => client.disconnect(), 2000);
  // }, 5 * 60 * 1000);
}

main().catch(error => {
  console.error('[✗] Error:', error);
  process.exit(1);
});
