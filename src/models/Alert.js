const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    // Alert Severity Levels
    level: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH'],
      required: true,
      index: true,
    },

    // Alert Type
    type: {
      type: String,
      enum: [
        'AIR_QUALITY_ALERT',
        'HEALTH_ALERT',
      ],
      required: true,
      index: true,
    },

    // User classification (for health alerts)
    classification: {
      type: String,
      enum: ['asthma_patient', 'children', 'elderly', 'adults', null],
      sparse: true,
      index: true,
    },

    classificationDisplayName: String,

    // Alert Title (for health alerts)
    title: String,

    // Alert Message
    message: {
      type: String,
      required: true,
    },

    // Recommendations
    recommendations: String,

    // Potential health effects
    potentialHealthEffects: [String],

    // Breached metrics
    breachedMetrics: [
      {
        metric: String,
        value: Number,
        severity: String
      }
    ],

    // Trigger Values (for reference and debugging)
    triggerValues: {
      pm25: Number,
      aqi: Number,
      mq135_ppm: Number,
      mq_score: Number,
      correctedPPM: Number,
      aci: Number,
      uaqs: Number,
      cri: Number,
      temperature: Number,
      humidity: Number,
      timestamp: Date,
    },

    // Exposure metrics at alert time
    exposureMetrics: {
      average_1h_UAQS: Number,
      average_3h_UAQS: Number,
      cumulativeExposure: Number,
    },

    // Risk Assessment
    riskAssessment: {
      healthImplication: String,
      recommendation: String,
      affectedClassification: String,
    },

    // Alert Status
    isAcknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedAt: Date,
    acknowledgedBy: String,

    // Alert Cooldown (to prevent alert spam)
    cooldownUntil: {
      type: Date,
      default: null,
    },

    // Reference to sensor data
    sensorDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SensorData',
      index: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: false,
  }
);

AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ level: 1, createdAt: -1 });
AlertSchema.index({ isAcknowledged: 1, createdAt: -1 });
AlertSchema.index({ type: 1, createdAt: -1 });
AlertSchema.index({ classification: 1, createdAt: -1 });
AlertSchema.index({ classification: 1, type: 1, createdAt: -1 });
AlertSchema.index({ classification: 1, isAcknowledged: 1, createdAt: -1 });

AlertSchema.methods.acknowledge = function (acknowledgedBy = 'SYSTEM') {
  this.isAcknowledged = true;
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = acknowledgedBy;
  return this.save();
};

AlertSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Alert', AlertSchema);
