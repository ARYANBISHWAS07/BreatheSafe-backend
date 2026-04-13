const {
  ONE_HOUR_MS,
  calculateAQI,
  applyHumidityCorrection,
  computeACI,
  computeUAQS,
  updateExposure,
  computeRollingAverage,
  computeCRI,
  determineAlertLevel,
  AirQualityAnalyticsProcessor,
} = require('../src/utils/analytics');

describe('analytics module', () => {
  test('calculateAQI converts PM2.5 using capped standard breakpoints', () => {
    expect(calculateAQI(10)).toBeGreaterThan(0);
    expect(calculateAQI(35.4)).toBe(100);
    expect(calculateAQI(500)).toBeCloseTo(499.68, 2);
  });

  test('applyHumidityCorrection uses requested humidity factor formula', () => {
    expect(applyHumidityCorrection(100, 65)).toBe(100);
    expect(applyHumidityCorrection(100, 75)).toBe(110);
    expect(applyHumidityCorrection(100, 55)).toBe(90);
  });

  test('computeACI maps corrected ppm to discrete bands', () => {
    expect(computeACI(10)).toBe(50);
    expect(computeACI(75)).toBe(100);
    expect(computeACI(150)).toBe(150);
    expect(computeACI(250)).toBe(200);
  });

  test('computeUAQS, exposure, cri, and alert level follow spec', () => {
    expect(computeUAQS(100, 200)).toBe(130);
    expect(updateExposure(140, 1.5, 10)).toBe(220);
    expect(computeCRI(7.5)).toBe(75);
    expect(determineAlertLevel(140, 75)).toBe('HIGH');
    expect(determineAlertLevel(110, 20)).toBe('MODERATE');
    expect(determineAlertLevel(90, 30)).toBe('LOW');
  });

  test('computeRollingAverage only uses values inside the requested window', () => {
    const now = Date.now();
    const data = [
      { uaqs: 100, timestamp: now - (2 * ONE_HOUR_MS) },
      { uaqs: 120, timestamp: now - (30 * 60 * 1000) },
      { uaqs: 140, timestamp: now - (10 * 60 * 1000) },
    ];

    expect(computeRollingAverage(data, ONE_HOUR_MS, now)).toBe(130);
  });

  test('processor tracks cumulative exposure and rolling averages', () => {
    const processor = new AirQualityAnalyticsProcessor();
    const start = Date.now();

    const first = processor.processReading({
      pm25: 25,
      mq135_ppm: 60,
      humidity: 65,
      temperature: 28,
      timestamp: start,
    });

    const second = processor.processReading({
      pm25: 45,
      mq135_ppm: 120,
      humidity: 70,
      temperature: 29,
      timestamp: start + ONE_HOUR_MS,
    });

    expect(first.exposure).toBe(0);
    expect(second.exposure).toBe(second.uaqs);
    expect(second.average_1h_UAQS).toBeGreaterThan(0);
    expect(second.average_3h_UAQS).toBeGreaterThanOrEqual(second.average_1h_UAQS);
    expect(['LOW', 'MODERATE', 'HIGH']).toContain(second.alertLevel);
  });

  test('processor prefers device-computed metrics when provided', () => {
    const processor = new AirQualityAnalyticsProcessor();

    const processed = processor.processReading({
      pm25: 42,
      aqi: 118,
      mq_score: 210,
      uaqs: 145.6,
      cri: 62,
      exposure: 5.2,
      humidity: 58,
      temperature: 26,
      timestamp: Date.now(),
    });

    expect(processed.aqi).toBe(118);
    expect(processed.mq_score).toBe(210);
    expect(processed.correctedPPM).toBe(210);
    expect(processed.uaqs).toBe(145.6);
    expect(processed.cri).toBe(62);
    expect(processed.exposure).toBe(5.2);
  });
});

describe('sensor data normalization', () => {
  test('service accepts temp alias and exposes temperature in output', async () => {
    const SensorDataService = require('../src/services/SensorDataService');
    const service = new SensorDataService();

    const processed = await service.processSensorData({
      pm25: 0,
      mq135_ppm: 1.64,
      humidity: 58,
      temp: 24.9,
      timestamp: Date.now(),
    });

    expect(processed.temperature).toBe(24.9);
    expect(processed.temp).toBe(24.9);
    expect(processed.correctedPPM).toBeGreaterThan(0);
    expect(processed.average_1h_UAQS).toBeDefined();
    expect(processed.average_3h_UAQS).toBeDefined();
  });

  test('service accepts new esp32 payload fields directly', async () => {
    const SensorDataService = require('../src/services/SensorDataService');
    const service = new SensorDataService();

    const processed = await service.processSensorData({
      pm25: 35,
      aqi: 99,
      mq_score: 175,
      uaqs: 121.8,
      cri: 48,
      exposure: 3.7,
      humidity: 62,
      temp: 27.1,
      timestamp: 123456,
    });

    expect(processed.temperature).toBe(27.1);
    expect(processed.aqi).toBe(99);
    expect(processed.mq_score).toBe(175);
    expect(processed.uaqs).toBe(121.8);
    expect(processed.cri).toBe(48);
    expect(processed.exposure).toBe(3.7);
    expect(processed.timestamp).toBeGreaterThan(Date.now() - 10000);
  });
});
