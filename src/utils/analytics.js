/**
 * Canonical air-quality analytics module.
 * All calculations are transport-agnostic and reusable.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const THREE_HOURS_MS = 3 * ONE_HOUR_MS;

const PM25_BREAKPOINTS = [
  { concentrationLow: 0.0, concentrationHigh: 12.0, aqiLow: 0, aqiHigh: 50 },
  { concentrationLow: 12.1, concentrationHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
  { concentrationLow: 35.5, concentrationHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
  { concentrationLow: 55.5, concentrationHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
  { concentrationLow: 150.5, concentrationHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
  { concentrationLow: 250.5, concentrationHigh: 500.4, aqiLow: 301, aqiHigh: 500 },
];

const roundToTwoDecimals = (value) => Math.round(value * 100) / 100;

// Lightweight logger - prefer central logger but keep dependency-free for utils
const safeLog = (tag, obj) => {
  try {
    /* eslint-disable no-console */
    console.debug(`[analytics] ${tag}:`, typeof obj === 'object' ? JSON.stringify(obj) : obj);
    /* eslint-enable no-console */
  } catch (e) {
    // ignore logging errors
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTimestamp = (timestamp) => {
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  let numericTimestamp = toFiniteNumber(timestamp, Date.now());

  // Some devices send timestamps in seconds (small numbers). If the value
  // looks like seconds (less than 1e12), convert to milliseconds.
  // 1e12 ms is ~2001-09-09 — current epoch ms values are > 1e12.
  if (Number.isFinite(numericTimestamp) && numericTimestamp > 0 && numericTimestamp < 1e12) {
    numericTimestamp = numericTimestamp * 1000;
  }

  return numericTimestamp > 0 ? numericTimestamp : Date.now();
};

const trimWindow = (readings, windowSize, currentTimestamp) =>
  readings.filter((reading) => currentTimestamp - reading.timestamp <= windowSize);

const calculateAQI = (pm25) => {
  const concentration = clamp(
    toFiniteNumber(pm25, 0),
    0,
    PM25_BREAKPOINTS[PM25_BREAKPOINTS.length - 1].concentrationHigh
  );

  const breakpoint = PM25_BREAKPOINTS.find(
    ({ concentrationLow, concentrationHigh }) =>
      concentration >= concentrationLow && concentration <= concentrationHigh
  ) || PM25_BREAKPOINTS[PM25_BREAKPOINTS.length - 1];

  const standardAQI =
    ((breakpoint.aqiHigh - breakpoint.aqiLow) /
      (breakpoint.concentrationHigh - breakpoint.concentrationLow)) *
      (concentration - breakpoint.concentrationLow) +
    breakpoint.aqiLow;

  return roundToTwoDecimals(clamp(standardAQI, 0, 200));
};

const computeHumidityFactor = (humidity) => {
  const safeHumidity = clamp(toFiniteNumber(humidity, 0), 0, 100);
  return roundToTwoDecimals(1 + (safeHumidity - 65) * 0.01);
};

const applyHumidityCorrection = (ppm, humidity) => {
  const correctedPPM = toFiniteNumber(ppm, 0) * computeHumidityFactor(humidity);
  return roundToTwoDecimals(Math.max(0, correctedPPM));
};

const computeACI = (ppm) => {
  const safePPM = Math.max(0, toFiniteNumber(ppm, 0));

  if (safePPM < 50) return 50;
  if (safePPM < 100) return 100;
  if (safePPM < 200) return 150;
  return 200;
};

const computeUAQS = (aqi, aci) => {
  const safeAQI = clamp(toFiniteNumber(aqi, 0), 0, 200);
  const safeACI = clamp(toFiniteNumber(aci, 0), 0, 200);
  return roundToTwoDecimals((0.6 * safeAQI) + (0.4 * safeACI));
};

const updateExposure = (uaqs, deltaTimeHours, currentExposure = 0) => {
  const safeUAQS = Math.max(0, toFiniteNumber(uaqs, 0));
  const safeDeltaTimeHours = Math.max(0, toFiniteNumber(deltaTimeHours, 0));
  const safeExposure = Math.max(0, toFiniteNumber(currentExposure, 0));
  return roundToTwoDecimals(safeExposure + (safeUAQS * safeDeltaTimeHours));
};

const computeRollingAverage = (data, windowSize, currentTimestamp = Date.now()) => {
  const normalizedTimestamp = normalizeTimestamp(currentTimestamp);
  const relevantData = trimWindow(
    Array.isArray(data) ? data : [],
    windowSize,
    normalizedTimestamp
  );

  if (relevantData.length === 0) {
    return 0;
  }

  const total = relevantData.reduce((sum, entry) => sum + toFiniteNumber(entry.uaqs, 0), 0);
  return roundToTwoDecimals(total / relevantData.length);
};

const computeCRI = (uaqs, exposureTime, humidityFactor) => {
  const safeUAQS = Math.max(0, toFiniteNumber(uaqs, 0));
  const safeExposureTime = Math.max(0, toFiniteNumber(exposureTime, 0));
  const safeHumidityFactor = Math.max(0, toFiniteNumber(humidityFactor, 1));
  return roundToTwoDecimals(safeUAQS * safeExposureTime * safeHumidityFactor);
};

const determineAlertLevel = (uaqs, cri) => {
  const safeUAQS = toFiniteNumber(uaqs, 0);
  const safeCRI = toFiniteNumber(cri, 0);

  if (safeUAQS > 150 || safeCRI > 200) {
    return 'HIGH';
  }

  if (safeUAQS > 100 || safeCRI > 100) {
    return 'MODERATE';
  }

  return 'LOW';
};

class AirQualityAnalyticsProcessor {
  constructor() {
    this.cumulativeExposure = 0;
    this.previousTimestamp = null;
    this.readings = [];
  }

  processReading(reading) {
    const timestamp = normalizeTimestamp(reading.timestamp);
    const pm25 = Math.max(0, toFiniteNumber(reading.pm25, 0));
    const mq135_ppm = Math.max(0, toFiniteNumber(reading.mq135_ppm, 0));
    const humidity = clamp(toFiniteNumber(reading.humidity, 0), 0, 100);
    const temperature = toFiniteNumber(reading.temperature, 0);

    const aqi = calculateAQI(pm25);
    const humidityFactor = computeHumidityFactor(humidity);
    const correctedPPM = applyHumidityCorrection(mq135_ppm, humidity);
    const aci = computeACI(correctedPPM);
    const uaqs = computeUAQS(aqi, aci);

    // Debug: log intermediate values so we can reconcile device vs server UAQS
    safeLog('intermediate', {
      timestamp,
      pm25,
      mq135_ppm,
      humidity,
      aqi,
      humidityFactor,
      correctedPPM,
      aci,
      uaqs,
    });

    const deltaTimeHours = this.previousTimestamp === null
      ? 0
      : Math.max(0, (timestamp - this.previousTimestamp) / ONE_HOUR_MS);

    this.cumulativeExposure = updateExposure(uaqs, deltaTimeHours, this.cumulativeExposure);
    this.previousTimestamp = timestamp;

    this.readings.push({ uaqs, timestamp });
    this.readings = trimWindow(this.readings, THREE_HOURS_MS, timestamp);

    const average_1h_UAQS = computeRollingAverage(this.readings, ONE_HOUR_MS, timestamp);
    const average_3h_UAQS = computeRollingAverage(this.readings, THREE_HOURS_MS, timestamp);

    const threeHourReadings = trimWindow(this.readings, THREE_HOURS_MS, timestamp);
    const exposureTimeHours = threeHourReadings.length > 1
      ? Math.max(0, (timestamp - threeHourReadings[0].timestamp) / ONE_HOUR_MS)
      : deltaTimeHours;

    const cri = computeCRI(uaqs, exposureTimeHours, humidityFactor);
    const alertLevel = determineAlertLevel(uaqs, cri);

    return {
      pm25,
      aqi,
      mq135_ppm: roundToTwoDecimals(mq135_ppm),
      correctedPPM,
      aci,
      uaqs,
      exposure: this.cumulativeExposure,
      average_1h_UAQS,
      average_3h_UAQS,
      cri,
      humidity,
      temperature,
      alertLevel,
      timestamp,
      humidityFactor,
      deltaTimeHours: roundToTwoDecimals(deltaTimeHours),
      exposureTimeHours: roundToTwoDecimals(exposureTimeHours),
    };
  }

  getState() {
    return {
      exposure: this.cumulativeExposure,
      readingsInMemory: this.readings.length,
      average_1h_UAQS: computeRollingAverage(this.readings, ONE_HOUR_MS),
      average_3h_UAQS: computeRollingAverage(this.readings, THREE_HOURS_MS),
    };
  }

  reset() {
    this.cumulativeExposure = 0;
    this.previousTimestamp = null;
    this.readings = [];
  }
}

module.exports = {
  ONE_HOUR_MS,
  THREE_HOURS_MS,
  calculateAQI,
  computeHumidityFactor,
  applyHumidityCorrection,
  computeACI,
  computeUAQS,
  updateExposure,
  computeRollingAverage,
  computeCRI,
  determineAlertLevel,
  AirQualityAnalyticsProcessor,
};
