/**
 * Logger Utility
 * Centralized logging with timestamp and level support
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'] || LOG_LEVELS.INFO;

const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
};

const logger = {
  debug: (message, data) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, data));
    }
  },
  info: (message, data) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, data));
    }
  },
  warn: (message, data) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, data));
    }
  },
  error: (message, data) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, data));
    }
  },
};

module.exports = logger;
