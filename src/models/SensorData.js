const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema(
  {
    pm25: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    aqi: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
    },
    mq135_ppm: {
      type: Number,
      required: true,
      min: 0,
    },
    mq_score: {
      type: Number,
      min: 0,
      max: 500,
    },
    correctedPPM: {
      type: Number,
      required: true,
      min: 0,
    },
    aci: {
      type: Number, 
      required: true,
      min: 0,
      max: 500,
    },
    temperature: {
      type: Number,
      min: -40,
      max: 85,
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    humidityFactor: {
      type: Number,
      required: true,
    },
    uaqs: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
      index: true,
    },
    exposure: {
      type: Number,
      required: true,
      min: 0,
    },
    average_1h_UAQS: {
      type: Number,
      required: true,
      min: 0,
    },
    average_3h_UAQS: {
      type: Number,
      required: true,
      min: 0,
    },
    cri: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    alertLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH'],
      index: true,
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SensorDataSchema.index({ timestamp: -1 });
SensorDataSchema.index({ recordedAt: -1 });
SensorDataSchema.index({ pm25: 1, timestamp: -1 });
SensorDataSchema.index({ aqi: 1, timestamp: -1 });

SensorDataSchema.virtual('ageSeconds').get(function () {
  return Math.floor((Date.now() - this.recordedAt) / 1000);
});

SensorDataSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SensorData', SensorDataSchema);
