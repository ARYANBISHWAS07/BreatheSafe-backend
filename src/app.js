/**
 * Express Application Factory
 * Creates and configures the Express app with all middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const createApp = (controllers) => {
  const app = express();

  // Security middleware
  app.use(helmet());


  // CORS configuration
  const corsOriginString = process.env.SOCKET_IO_CORS || 'http://localhost:3001';
  const corsOrigins = corsOriginString.split(',').map(origin => origin.trim());
  const corsOptions = {
    origin: corsOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Request logging
  app.use(morgan('combined', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Health check (no dependencies)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API v1 routes
  const apiRouter = express.Router();

  // Mount controllers
  if (controllers.sensorDataRoutes) {
    apiRouter.use(controllers.sensorDataRoutes);
  }
  if (controllers.alertsRoutes) {
    apiRouter.use(controllers.alertsRoutes);
  }
  if (controllers.healthAlertsRoutes) {
    apiRouter.use(controllers.healthAlertsRoutes);
  }
  if (controllers.userRoutes) {
    apiRouter.use(controllers.userRoutes);
  }
  if (controllers.systemRoutes) {
    apiRouter.use(controllers.systemRoutes);
  }

  app.use('/api', apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.path,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
