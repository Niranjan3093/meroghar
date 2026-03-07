import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  platformName: {
    type: String,
    default: 'MeroGhar',
    trim: true,
    maxlength: 80
  },
  supportEmail: {
    type: String,
    default: 'support@meroghar.com',
    trim: true,
    lowercase: true
  },
  maxPropertiesPerHost: {
    type: Number,
    default: 10,
    min: 1,
    max: 500
  },
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  autoApproveProperties: {
    type: Boolean,
    default: false
  },
  maxLoginAttempts: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently performing scheduled maintenance. Please check back later.',
    maxlength: 500
  },
  adminNotificationEmail: {
    type: String,
    default: 'support@meroghar.com',
    trim: true,
    lowercase: true
  },
  adminEmailNotifications: {
    newUserRegistration: {
      type: Boolean,
      default: true
    },
    propertyPendingApproval: {
      type: Boolean,
      default: true
    },
    maxLoginAttemptsExceeded: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
