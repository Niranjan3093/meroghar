import { jest } from '@jest/globals';

export const mockLeaseRequest = { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() };
export const mockLease = { create: jest.fn() };
export const mockProperty = { findById: jest.fn(), findByIdAndUpdate: jest.fn() };
export const mockPayment = { create: jest.fn() };
export const mockNotification = { create: jest.fn(), find: jest.fn() };
export const mockUser = { findById: jest.fn() };
export const mockAppSettings = { findOne: jest.fn(), create: jest.fn() };
export const mockGetAppSettings = jest.fn(() => mockAppSettings.findOne());
export const mockMessage = { create: jest.fn() };
export const mockConversation = { findById: jest.fn() };
export const mockNotifyLeaseRequest = jest.fn();
export const mockNotifyLeaseRequestResponse = jest.fn();
export const mockJwt = { verify: jest.fn() };
export const mockKhalti = {
  initiateKhaltiPayment: jest.fn(),
  verifyKhaltiPayment: jest.fn(),
  validateKhaltiConfig: jest.fn().mockReturnValue({ valid: true, message: 'ok' })
};

export const LeaseRequest = mockLeaseRequest;
export const Lease = mockLease;
export const Property = mockProperty;
export const Payment = mockPayment;
export const Notification = mockNotification;
export const User = mockUser;
export const AppSettings = mockAppSettings;
export const Message = mockMessage;
export const Conversation = mockConversation;
export const jwt = mockJwt;
export const khalti = mockKhalti;
export const notifyLeaseRequest = mockNotifyLeaseRequest;
export const notifyLeaseRequestResponse = mockNotifyLeaseRequestResponse;

jest.unstable_mockModule('../models/LeaseRequest.js', () => ({ default: mockLeaseRequest }));
jest.unstable_mockModule('../models/Lease.js', () => ({ default: mockLease }));
jest.unstable_mockModule('../models/Property.js', () => ({ default: mockProperty }));
jest.unstable_mockModule('../models/Payment.js', () => ({ default: mockPayment }));
jest.unstable_mockModule('../models/Notification.js', () => ({ default: mockNotification }));
jest.unstable_mockModule('../models/User.js', () => ({ default: mockUser }));
jest.unstable_mockModule('../models/AppSettings.js', () => ({ default: mockAppSettings }));
jest.unstable_mockModule('../models/Message.js', () => ({ Message: mockMessage, Conversation: mockConversation }));
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
jest.unstable_mockModule('../utils/appSettings.js', () => ({ getAppSettings: mockGetAppSettings }));
jest.unstable_mockModule('../utils/notifications.js', () => ({ notifyLeaseRequest: mockNotifyLeaseRequest, notifyLeaseRequestResponse: mockNotifyLeaseRequestResponse }));
jest.unstable_mockModule('../utils/khalti.js', () => mockKhalti);

const { default: router } = await import('../routes/leaseRequestRoutes.js');
const { protect } = await import('../middleware/authMiddleware.js');
const { enforceMaintenanceMode } = await import('../middleware/maintenanceMiddleware.js');

export { protect, enforceMaintenanceMode };

export const getRouteHandler = (method, path) => {
  const layer = router.stack.find((s) => s.route && s.route.path === path && s.route.methods[method]);
  if (!layer) throw new Error(`Route not found: ${method} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

export const createPopulateChain = (result, calls) => {
  let n = 0;
  const chain = {
    populate: jest.fn(() => {
      n += 1;
      return n >= calls ? Promise.resolve(result) : chain;
    })
  };
  return chain;
};

export const makeReq = ({ body = {}, params = {}, user = {}, app } = {}) => ({
  body,
  params,
  user,
  app: app || { get: jest.fn().mockReturnValue({ to: jest.fn().mockReturnValue({ emit: jest.fn() }) }) }
});

export const makeRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

export const makeMiddlewareReq = ({ headers = {}, user, path = '/api/secure' } = {}) => ({
  headers,
  user,
  path
});

export const makeNext = () => jest.fn();

export const resetMiddlewareMocks = () => {
  jwt.verify.mockReset();
  User.findById.mockReset();
  AppSettings.findOne.mockReset();
  AppSettings.create.mockReset();
  mockGetAppSettings.mockReset();
  mockGetAppSettings.mockImplementation(() => mockAppSettings.findOne());
};

export const resetAll = () => {
  jest.clearAllMocks();
  mockNotifyLeaseRequest.mockResolvedValue(undefined);
  mockNotifyLeaseRequestResponse.mockResolvedValue(undefined);
  Message.create.mockResolvedValue(undefined);
  AppSettings.findOne.mockResolvedValue({
    key: 'global',
    maintenanceMode: false,
    maintenanceMessage: 'Maintenance',
    requireEmailVerification: false
  });
  AppSettings.create.mockResolvedValue({
    key: 'global',
    maintenanceMode: false,
    maintenanceMessage: 'Maintenance',
    requireEmailVerification: false
  });
  mockGetAppSettings.mockResolvedValue({
    key: 'global',
    maintenanceMode: false,
    maintenanceMessage: 'Maintenance',
    requireEmailVerification: false
  });
};
