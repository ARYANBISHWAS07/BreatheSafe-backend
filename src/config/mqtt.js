/**
 * MQTT Configuration
 * Centralizes MQTT broker connection settings
 */

module.exports = {
  broker: {
    url: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  },
  options: {
    clientId: `air-quality-backend-${Date.now()}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD) || 5000,
    keepalive: parseInt(process.env.MQTT_KEEP_ALIVE) || 60,
    will: {
      topic: 'air-quality/status',
      payload: JSON.stringify({ status: 'offline', timestamp: new Date() }),
      qos: 1,
      retain: true,
    },
  },
  topics: {
    data: process.env.MQTT_TOPIC || 'air-quality/data',
    status: 'air-quality/status',
    alerts: process.env.MQTT_ALERTS_TOPIC || 'air-quality/alerts',
  },
};
