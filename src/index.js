#!/usr/bin/env node

/**
 * Air Quality Monitoring System - Backend Server
 * Main entry point for the application
 *
 * Features:
 * - MQTT sensor data ingestion
 * - Real-time alerts via Socket.IO
 * - RESTful API for data queries
 * - MongoDB persistence
 * - Offline data buffering with retry logic
 */

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const { connectDatabase } = require('./config/database');
const createApp = require('./app');
const MQTTClient = require('./mqtt/mqttClient');
const SensorDataService = require('./services/SensorDataService');
const AlertsService = require('./services/AlertsService');
const SensorDataController = require('./controllers/SensorDataController');
const AlertsController = require('./controllers/AlertsController');
const SystemController = require('./controllers/SystemController');
const createSensorDataRoutes = require('./routes/sensorDataRoutes');
const createAlertsRoutes = require('./routes/alertsRoutes');
const createSystemRoutes = require('./routes/systemRoutes');
const { setupSocketIO, broadcastSystemStatus } = require('./socketIO');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Main application startup
 */
const startServer = async () => {
  try {
    logger.info('🚀 Starting Air Quality Monitoring Backend...');

    // Connect to MongoDB
    logger.info('📡 Connecting to MongoDB...');
    await connectDatabase();

    // Initialize services
    const sensorDataService = new SensorDataService();
    const alertsService = new AlertsService(null, null); // Will attach io and mqttClient after creation

    // Initialize controllers
    const sensorDataController = new SensorDataController(sensorDataService);
    const alertsController = new AlertsController(alertsService);
    const systemController = new SystemController();

    // Initialize routes
    const sensorDataRoutes = createSensorDataRoutes(sensorDataController);
    const alertsRoutes = createAlertsRoutes(alertsController);
    const systemRoutes = createSystemRoutes(systemController);

    // Create Express app
    const app = createApp({
      sensorDataRoutes,
      alertsRoutes,
      systemRoutes,
    });

    // Create HTTP server with Socket.IO
    const httpServer = http.createServer(app);
    // Parse SOCKET_IO_CORS environment variable to support multiple origins
    const corsOriginString = process.env.SOCKET_IO_CORS || "http://localhost:3000";
    const socketIOCorsOrigins = corsOriginString.split(",").map(origin => origin.trim());
    
    const io = new Server(httpServer, {
      cors: {
        origin: socketIOCorsOrigins,
        credentials: true,
      },
    });







    // Initialize MQTT client with Socket.IO instance
    logger.info('📨 Initializing MQTT client...');
    const mqttClient = new MQTTClient(sensorDataService, alertsService, io);

    // Setup Socket.IO
    setupSocketIO(io, {
      sensorDataService,
      getSystemStatus: () => ({
        timestamp: new Date(),
        uptime: process.uptime(),
        mqtt: mqttClient.getStatus(),
        memory: process.memoryUsage(),
      }),
    });
    
    // Attach io and mqttClient to alerts service
    alertsService.io = io;
    alertsService.mqttClient = mqttClient;

    mqttClient.connect();
    systemController.mqttClient = mqttClient;

    // Periodic queue processing (every 30 seconds)
    const queueFlushInterval = parseInt(process.env.QUEUE_FLUSH_INTERVAL) || 30000;
    setInterval(() => {
      if (mqttClient.dataQueue.size() > 0) {
        logger.debug(`Processing queue: ${mqttClient.dataQueue.size()} items`);
        mqttClient.processQueue();
      }
    }, queueFlushInterval);

    // Broadcast system status every minute
    setInterval(() => {
      const status = {
        timestamp: new Date(),
        uptime: process.uptime(),
        mqtt: mqttClient.getStatus(),
        memory: process.memoryUsage(),
      };
      broadcastSystemStatus(io, status);
    }, 60000);

    // Periodic data cleanup (daily)
    setInterval(async () => {
      try {
        await sensorDataService.cleanupOldData(30); // Keep 30 days of data
        logger.info('Data cleanup completed');
      } catch (error) {
        logger.error('Error during cleanup:', error.message);
      }
    }, 24 * 3600000);

    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      logger.info(`✓ Server running at http://${HOST}:${PORT}`);
      logger.info(`✓ Health check: http://${HOST}:${PORT}/health`);
      logger.info(`✓ API documentation: http://${HOST}:${PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('🛑 Shutting down gracefully...');

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        mqttClient.disconnect();
        logger.info('MQTT disconnected');

        const { disconnectDatabase } = require('./config/database');
        await disconnectDatabase();
        logger.info('Database disconnected');

        logger.info('✓ Server shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error.message);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Fatal error during startup:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
