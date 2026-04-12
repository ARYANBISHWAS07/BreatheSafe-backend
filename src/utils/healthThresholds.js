/**
 * Health Thresholds Configuration
 * Defines classification-specific thresholds for alert generation
 * Based on WHO, EPA guidelines and medical recommendations
 */

const HEALTH_THRESHOLDS = {
  asthma_patient: {
    // Asthma patients are highly sensitive to air quality changes
    pm25: {
      safe: 12,
      caution: 25,
      warning: 50,
      danger: 75,
      description: 'PM2.5 concentration in µg/m³'
    },
    aqi: {
      safe: 50,
      caution: 80,
      warning: 120,
      danger: 150,
      description: 'Air Quality Index'
    },
    mq135_ppm: {
      safe: 100,
      caution: 200,
      warning: 400,
      danger: 600,
      description: 'MQ135 Gas Sensor PPM'
    },
    uaqs: {
      safe: 40,
      caution: 80,
      warning: 120,
      danger: 150,
      description: 'Unified Air Quality Score'
    },
    cri: {
      safe: 20,
      caution: 40,
      warning: 60,
      danger: 80,
      description: 'Critical Risk Index'
    },
    temperature: {
      min: 15,
      max: 28,
      description: 'Temperature in °C'
    },
    humidity: {
      min: 30,
      max: 70,
      description: 'Humidity in %'
    }
  },

  children: {
    // Children have developing lungs, sensitive to pollution
    pm25: {
      safe: 15,
      caution: 30,
      warning: 60,
      danger: 100,
      description: 'PM2.5 concentration in µg/m³'
    },
    aqi: {
      safe: 60,
      caution: 100,
      warning: 140,
      danger: 180,
      description: 'Air Quality Index'
    },
    mq135_ppm: {
      safe: 150,
      caution: 300,
      warning: 500,
      danger: 800,
      description: 'MQ135 Gas Sensor PPM'
    },
    uaqs: {
      safe: 50,
      caution: 100,
      warning: 140,
      danger: 170,
      description: 'Unified Air Quality Score'
    },
    cri: {
      safe: 30,
      caution: 50,
      warning: 70,
      danger: 90,
      description: 'Critical Risk Index'
    },
    temperature: {
      min: 18,
      max: 28,
      description: 'Temperature in °C'
    },
    humidity: {
      min: 35,
      max: 65,
      description: 'Humidity in %'
    }
  },

  elderly: {
    // Elderly people have reduced lung function
    pm25: {
      safe: 10,
      caution: 20,
      warning: 40,
      danger: 60,
      description: 'PM2.5 concentration in µg/m³'
    },
    aqi: {
      safe: 40,
      caution: 75,
      warning: 110,
      danger: 140,
      description: 'Air Quality Index'
    },
    mq135_ppm: {
      safe: 80,
      caution: 150,
      warning: 300,
      danger: 500,
      description: 'MQ135 Gas Sensor PPM'
    },
    uaqs: {
      safe: 35,
      caution: 70,
      warning: 110,
      danger: 140,
      description: 'Unified Air Quality Score'
    },
    cri: {
      safe: 15,
      caution: 35,
      warning: 55,
      danger: 75,
      description: 'Critical Risk Index'
    },
    temperature: {
      min: 20,
      max: 26,
      description: 'Temperature in °C'
    },
    humidity: {
      min: 40,
      max: 60,
      description: 'Humidity in %'
    }
  },

  adults: {
    // General healthy adults - standard thresholds
    pm25: {
      safe: 20,
      caution: 35,
      warning: 75,
      danger: 150,
      description: 'PM2.5 concentration in µg/m³'
    },
    aqi: {
      safe: 75,
      caution: 120,
      warning: 160,
      danger: 200,
      description: 'Air Quality Index'
    },
    mq135_ppm: {
      safe: 200,
      caution: 400,
      warning: 700,
      danger: 1000,
      description: 'MQ135 Gas Sensor PPM'
    },
    uaqs: {
      safe: 60,
      caution: 120,
      warning: 160,
      danger: 190,
      description: 'Unified Air Quality Score'
    },
    cri: {
      safe: 40,
      caution: 60,
      warning: 80,
      danger: 100,
      description: 'Critical Risk Index'
    },
    temperature: {
      min: 16,
      max: 30,
      description: 'Temperature in °C'
    },
    humidity: {
      min: 30,
      max: 70,
      description: 'Humidity in %'
    }
  }
};

/**
 * Determine alert level based on classification and sensor data
 * @param {string} classification - User classification
 * @param {object} sensorData - Current sensor data
 * @returns {object} Alert assessment with level and breached thresholds
 */
const determineAlertLevelByClassification = (classification, sensorData) => {
  if (!HEALTH_THRESHOLDS[classification]) {
    return { level: 'UNKNOWN', breachedThresholds: [] };
  }

  const thresholds = HEALTH_THRESHOLDS[classification];
  const breachedThresholds = [];
  let maxSeverity = 0; // 0: safe, 1: caution, 2: warning, 3: danger

  // Check PM2.5
  if (sensorData.pm25 !== undefined) {
    const severity = checkThreshold(sensorData.pm25, thresholds.pm25);
    if (severity > 0) {
      breachedThresholds.push({
        metric: 'pm25',
        value: sensorData.pm25,
        thresholds: thresholds.pm25,
        severity: ['caution', 'warning', 'danger'][severity - 1]
      });
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }

  // Check AQI
  if (sensorData.aqi !== undefined) {
    const severity = checkThreshold(sensorData.aqi, thresholds.aqi);
    if (severity > 0) {
      breachedThresholds.push({
        metric: 'aqi',
        value: sensorData.aqi,
        thresholds: thresholds.aqi,
        severity: ['caution', 'warning', 'danger'][severity - 1]
      });
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }

  // Check MQ135 PPM
  if (sensorData.correctedPPM !== undefined) {
    const severity = checkThreshold(sensorData.correctedPPM, thresholds.mq135_ppm);
    if (severity > 0) {
      breachedThresholds.push({
        metric: 'mq135_ppm',
        value: sensorData.correctedPPM,
        thresholds: thresholds.mq135_ppm,
        severity: ['caution', 'warning', 'danger'][severity - 1]
      });
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }

  // Check UAQS
  if (sensorData.uaqs !== undefined) {
    const severity = checkThreshold(sensorData.uaqs, thresholds.uaqs);
    if (severity > 0) {
      breachedThresholds.push({
        metric: 'uaqs',
        value: sensorData.uaqs,
        thresholds: thresholds.uaqs,
        severity: ['caution', 'warning', 'danger'][severity - 1]
      });
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }

  // Check CRI
  if (sensorData.cri !== undefined) {
    const severity = checkThreshold(sensorData.cri, thresholds.cri);
    if (severity > 0) {
      breachedThresholds.push({
        metric: 'cri',
        value: sensorData.cri,
        thresholds: thresholds.cri,
        severity: ['caution', 'warning', 'danger'][severity - 1]
      });
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }

  // Check Temperature
  if (sensorData.temperature !== undefined) {
    if (sensorData.temperature < thresholds.temperature.min || 
        sensorData.temperature > thresholds.temperature.max) {
      breachedThresholds.push({
        metric: 'temperature',
        value: sensorData.temperature,
        thresholds: thresholds.temperature,
        severity: 'caution'
      });
      maxSeverity = Math.max(maxSeverity, 1); // caution
    }
  }

  // Check Humidity
  if (sensorData.humidity !== undefined) {
    if (sensorData.humidity < thresholds.humidity.min || 
        sensorData.humidity > thresholds.humidity.max) {
      breachedThresholds.push({
        metric: 'humidity',
        value: sensorData.humidity,
        thresholds: thresholds.humidity,
        severity: 'caution'
      });
      maxSeverity = Math.max(maxSeverity, 1); // caution
    }
  }

  const levelMap = ['NONE', 'LOW', 'MODERATE', 'HIGH'];
  const level = levelMap[maxSeverity];

  return {
    level,
    breachedThresholds,
    severity: maxSeverity
  };
};

/**
 * Check if a value exceeds thresholds
 * @param {number} value - Current value
 * @param {object} thresholds - Threshold object with safe, caution, warning, danger
 * @returns {number} Severity level (0=safe, 1=caution, 2=warning, 3=danger)
 */
const checkThreshold = (value, thresholds) => {
  if (value >= thresholds.danger) return 3;
  if (value >= thresholds.warning) return 2;
  if (value >= thresholds.caution) return 1;
  return 0;
};

/**
 * Get thresholds for a specific classification
 * @param {string} classification - User classification
 * @returns {object} Threshold configuration
 */
const getClassificationThresholds = (classification) => {
  return HEALTH_THRESHOLDS[classification] || null;
};

/**
 * Get all available classifications
 * @returns {array} Array of classification strings
 */
const getAvailableClassifications = () => {
  return Object.keys(HEALTH_THRESHOLDS);
};

module.exports = {
  HEALTH_THRESHOLDS,
  determineAlertLevelByClassification,
  checkThreshold,
  getClassificationThresholds,
  getAvailableClassifications,
};
