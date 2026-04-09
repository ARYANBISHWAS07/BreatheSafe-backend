/**
 * Socket.IO Configuration and Setup
 * Handles real-time WebSocket connections and events
 */

const logger = require('./utils/logger');

// Track subscribed clients
const subscriptions = {
  sensorUpdates: new Set(),
  alerts: new Set(),
};

const buildSensorPayload = (data) => ({
  timestamp: data?.timestamp ? new Date(data.timestamp) : new Date(),
  data,
  ...(data || {}),
});

const emitSensorUpdateToSocket = (socket, data) => {
  if (!data) {
    return;
  }

  socket.emit('sensor-update', buildSensorPayload(data));
};

const setupSocketIO = (io, options = {}) => {
  const { sensorDataService = null, getSystemStatus = null } = options;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Send connection confirmation
    socket.emit('connection-confirmation', {
      message: 'Connected to Air Quality Monitoring System',
      timestamp: new Date(),
      socketId: socket.id,
    });

    /**
     * Listen for client subscription to real-time sensor data
     */
    socket.on('subscribe-sensor-updates', async () => {
      subscriptions.sensorUpdates.add(socket.id);
      logger.debug(`Client ${socket.id} subscribed to sensor updates`);
      socket.emit('subscription-confirmed', {
        channel: 'sensor-updates',
        message: 'You will now receive real-time sensor updates',
      });

      try {
        const latestData = sensorDataService?.lastProcessedData
          || await sensorDataService?.getLatestData?.();

        if (latestData) {
          emitSensorUpdateToSocket(socket, latestData);
        }
      } catch (error) {
        logger.error(`Failed to emit latest sensor snapshot to ${socket.id}:`, error.message);
      }
    });

    /**
     * Listen for client subscription to alerts
     */
    socket.on('subscribe-alerts', () => {
      subscriptions.alerts.add(socket.id);
      logger.debug(`Client ${socket.id} subscribed to alerts`);
      socket.emit('subscription-confirmed', {
        channel: 'alerts',
        message: 'You will now receive real-time alerts',
      });
    });

    /**
     * Listen for unsubscribe events
     */
    socket.on('unsubscribe', (channel) => {
      if (channel === 'sensor-updates') {
        subscriptions.sensorUpdates.delete(socket.id);
      } else if (channel === 'alerts') {
        subscriptions.alerts.delete(socket.id);
      }
      logger.debug(`Client ${socket.id} unsubscribed from ${channel}`);
      socket.emit('unsubscription-confirmed', {
        channel,
      });
    });

    socket.on('request-latest-sensor-data', async () => {
      try {
        const latestData = sensorDataService?.lastProcessedData
          || await sensorDataService?.getLatestData?.();

        if (latestData) {
          emitSensorUpdateToSocket(socket, latestData);
        }
      } catch (error) {
        logger.error(`Failed to serve latest sensor data to ${socket.id}:`, error.message);
      }
    });

    socket.on('request-system-status', () => {
      if (typeof getSystemStatus !== 'function') {
        return;
      }

      socket.emit('system-status', {
        timestamp: new Date(),
        status: getSystemStatus(),
      });
    });

    /**
     * Handle client disconnect
     */
    socket.on('disconnect', () => {
      subscriptions.sensorUpdates.delete(socket.id);
      subscriptions.alerts.delete(socket.id);
      logger.info(`Client disconnected: ${socket.id}`);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      logger.error(`Socket error from ${socket.id}:`, error.message);
    });
  });

  logger.info('✓ Socket.IO configured');
  return io;
};

/**
 * Emit sensor data update to subscribed clients
 * @param {object} io - Socket.IO server instance
 * @param {object} data - Sensor data to emit
 */
const emitSensorUpdate = (io, data) => {
  if (subscriptions.sensorUpdates.size === 0) {
    return;
  }

  const payload = buildSensorPayload(data);

  // Emit to all subscribed clients
  subscriptions.sensorUpdates.forEach(socketId => {
    io.to(socketId).emit('sensor-update', payload);
  });
  
  logger.debug(`Sensor update broadcast to ${subscriptions.sensorUpdates.size} clients`);
};

/**
 * Emit alert to subscribed clients
 * @param {object} io - Socket.IO server instance
 * @param {object} alert - Alert data to emit
 */
const emitAlert = (io, alert) => {
  if (subscriptions.alerts.size === 0) {
    return;
  }
  
  const payload = {
    timestamp: new Date(),
    alert,
  };
  
  // Emit to all subscribed clients
  subscriptions.alerts.forEach(socketId => {
    io.to(socketId).emit('alert-triggered', payload);
  });
  
  // Also broadcast to sensor-updates subscribers as it's related to sensor data
  subscriptions.sensorUpdates.forEach(socketId => {
    io.to(socketId).emit('alert-triggered', payload);
  });
  
  logger.debug(`Alert broadcast to ${subscriptions.alerts.size + subscriptions.sensorUpdates.size} clients`);
};

/**
 * Broadcast system status to all connected clients
 * @param {object} io - Socket.IO server instance
 * @param {object} status - System status
 */
const broadcastSystemStatus = (io, status) => {
  io.emit('system-status', {
    timestamp: new Date(),
    status,
  });
};

module.exports = {
  setupSocketIO,
  emitSensorUpdate,
  emitAlert,
  broadcastSystemStatus,
};
