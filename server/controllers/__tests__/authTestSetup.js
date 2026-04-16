import { jest, test } from '@jest/globals';

export const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn()
};

export const mockSendEmail = jest.fn();
export const mockGetAppSettings = jest.fn();
export const mockNotifyNewUserRegistration = jest.fn();

export const mockBcrypt = {
  compare: jest.fn(),
  hash: jest.fn()
};

export const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn()
};

export const mockPassport = {
  authenticate: jest.fn(() => (req, res, next) => next && next()),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn()
};

jest.unstable_mockModule('../../models/User.js', () => ({
  default: mockUser
}));

jest.unstable_mockModule('../../utils/email.js', () => ({
  sendEmail: mockSendEmail
}));

jest.unstable_mockModule('../../utils/appSettings.js', () => ({
  getAppSettings: mockGetAppSettings
}));

jest.unstable_mockModule('../../utils/notifications.js', () => ({
  notifyNewUserRegistration: mockNotifyNewUserRegistration
}));

jest.unstable_mockModule('passport', () => ({
  default: mockPassport
}));

jest.unstable_mockModule('../../middleware/uploadMiddleware.js', () => ({
  cloudinary: {}
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt
}));

const authController = await import('../authController.js');

export const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword
} = authController;

export const makeRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  return res;
};

export const makeReq = ({ body = {}, params = {}, app = { get: jest.fn().mockReturnValue({}) } } = {}) => ({
  body,
  params,
  app
});

export const setupDefaultMocks = () => {
  mockGetAppSettings.mockResolvedValue({
    platformName: 'MeroGhar',
    maxLoginAttempts: 5,
    maintenanceMode: false,
    requireEmailVerification: false,
    adminEmailNotifications: { maxLoginAttemptsExceeded: false }
  });

  mockNotifyNewUserRegistration.mockResolvedValue(undefined);
};

test.skip('shared auth test setup', () => {});
