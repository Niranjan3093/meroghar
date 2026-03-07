import AppSettings from '../models/AppSettings.js';

export const DEFAULT_APP_SETTINGS = {
  key: 'global',
  platformName: 'MeroGhar',
  supportEmail: 'support@meroghar.com',
  maxPropertiesPerHost: 10,
  requireEmailVerification: true,
  autoApproveProperties: false,
  maxLoginAttempts: 5,
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back later.',
  adminNotificationEmail: 'support@meroghar.com',
  adminEmailNotifications: {
    newUserRegistration: true,
    propertyPendingApproval: true,
    maxLoginAttemptsExceeded: true
  }
};

export const getAppSettings = async () => {
  let settings = await AppSettings.findOne({ key: 'global' });

  if (!settings) {
    settings = await AppSettings.create(DEFAULT_APP_SETTINGS);
  }

  return settings;
};

export const toPublicSettings = (settingsDoc) => ({
  platformName: settingsDoc.platformName,
  supportEmail: settingsDoc.supportEmail,
  maintenanceMode: settingsDoc.maintenanceMode,
  maintenanceMessage: settingsDoc.maintenanceMessage
});
