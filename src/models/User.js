const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    // User identification
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      sparse: true,
    },

    // Health classification - Core field for alert thresholds
    classification: {
      type: String,
      enum: ['asthma_patient', 'children', 'elderly', 'adults'],
      required: true,
      index: true,
    },

    // Additional health information
    age: {
      type: Number,
      min: 0,
      max: 150,
    },

    // Contact preferences
    alertPreferences: {
      enableEmailAlerts: {
        type: Boolean,
        default: true,
      },
      enablePushAlerts: {
        type: Boolean,
        default: true,
      },
      enableSMSAlerts: {
        type: Boolean,
        default: false,
      },
      // Only receive alerts when thresholds are breached
      alertOnlyWhenThresholdBreached: {
        type: Boolean,
        default: true,
      },
      // Alert severity levels to receive
      alertLevels: {
        type: [String],
        enum: ['LOW', 'MODERATE', 'HIGH'],
        default: ['MODERATE', 'HIGH'],
      },
    },

    // Device/location information
    location: {
      type: String,
      sparse: true,
    },

    // User status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },

    // TTL for soft deletion
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1, classification: 1 });
UserSchema.index({ isActive: 1, classification: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for display name
UserSchema.virtual('classificationDisplayName').get(function () {
  const map = {
    asthma_patient: 'Asthma Patient',
    children: 'Children',
    elderly: 'Elderly',
    adults: 'General Adult',
  };
  return map[this.classification];
});

UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
