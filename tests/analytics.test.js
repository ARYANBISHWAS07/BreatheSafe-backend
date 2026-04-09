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
    expect(calculateAQI(500)).toBe(200);
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
    expect(computeUAQS(100, 200)).toBe(140);
    expect(updateExposure(140, 1.5, 10)).toBe(220);
    expect(computeCRI(140, 2, 1.1)).toBe(308);
    expect(determineAlertLevel(140, 308)).toBe('HIGH');
    expect(determineAlertLevel(110, 50)).toBe('MODERATE');
    expect(determineAlertLevel(90, 50)).toBe('LOW');
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
});
