import { jest } from '@jest/globals';

export const mockMaintenance = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
};

export const mockProperty = {
  findById: jest.fn()
};

export const mockLease = {
  findOne: jest.fn()
};

export const mockNotifyMaintenanceRequest = jest.fn();
export const mockNotifyMaintenanceResolved = jest.fn();
export const mockNotifyMaintenanceUpdate = jest.fn();

jest.unstable_mockModule('../models/Maintenance.js', () => ({
  default: mockMaintenance
}));

jest.unstable_mockModule('../models/Property.js', () => ({
  default: mockProperty
}));

jest.unstable_mockModule('../models/Lease.js', () => ({
  default: mockLease
}));

jest.unstable_mockModule('../utils/notifications.js', () => ({
  notifyMaintenanceRequest: mockNotifyMaintenanceRequest,
  notifyMaintenanceResolved: mockNotifyMaintenanceResolved,
  notifyMaintenanceUpdate: mockNotifyMaintenanceUpdate
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: jest.fn((req, _res, next) => next())
}));

jest.unstable_mockModule('../middleware/uploadMiddleware.js', () => ({
  upload: {
    array: jest.fn(() => (req, _res, next) => next())
  }
}));

const { default: router } = await import('../routes/maintenanceRoutes.js');

export const getRouteHandler = (method, path) => {
  const layer = router.stack.find((s) => s.route && s.route.path === path && s.route.methods[method]);
  if (!layer) throw new Error(`Route not found: ${method} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
};

export const createPopulateSortChain = (result) => {
  const chain = {
    populate: jest.fn(() => chain),
    sort: jest.fn().mockResolvedValue(result)
  };
  return chain;
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

export const makeReq = ({
  body = {},
  params = {},
  files,
  user = {},
  app
} = {}) => ({
  body,
  params,
  files,
  user,
  app: app || { get: jest.fn().mockReturnValue({ to: jest.fn().mockReturnValue({ emit: jest.fn() }) }) }
});

export const makeRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

export const resetMaintenanceRouteMocks = () => {
  jest.clearAllMocks();
};
