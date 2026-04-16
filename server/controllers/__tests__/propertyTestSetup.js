import { jest, test } from '@jest/globals';

export const mockProperty = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn()
};

export const mockAppSettings = {
  findOne: jest.fn(),
  create: jest.fn()
};

export const mockNotifyPendingProperty = jest.fn();

jest.unstable_mockModule('../../models/Property.js', () => ({
  default: mockProperty
}));

jest.unstable_mockModule('../../models/AppSettings.js', () => ({
  default: mockAppSettings
}));

jest.unstable_mockModule('../../utils/notifications.js', () => ({
  notifyPendingProperty: mockNotifyPendingProperty
}));

const propertyController = await import('../propertyController.js');

export const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty
} = propertyController;

export const makeRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  return res;
};

export const makeReq = ({
  query = {},
  params = {},
  body = {},
  user,
  app = { get: jest.fn().mockReturnValue({}) }
} = {}) => ({
  query,
  params,
  body,
  user,
  app
});

export const defaultSettings = {
  key: 'global',
  platformName: 'MeroGhar',
  supportEmail: 'support@meroghar.com',
  maxPropertiesPerHost: 10,
  requireEmailVerification: true,
  autoApproveProperties: false,
  maxLoginAttempts: 5,
  maintenanceMode: false,
  maintenanceMessage: 'Maintenance',
  adminNotificationEmail: 'support@meroghar.com',
  adminEmailNotifications: {
    newUserRegistration: true,
    propertyPendingApproval: true,
    maxLoginAttemptsExceeded: true
  }
};

export const setupDefaultMocks = () => {
  mockAppSettings.findOne.mockResolvedValue({ ...defaultSettings });
  mockNotifyPendingProperty.mockResolvedValue(undefined);
};

test.skip('shared property test setup', () => {});
