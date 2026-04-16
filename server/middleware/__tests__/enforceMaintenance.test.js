import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  jwt,
  AppSettings,
  makeRes,
  makeNext,
  makeMiddlewareReq,
  resetAll,
  resetMiddlewareMocks,
  enforceMaintenanceMode
} from '../../tests/setup.js';

describe('enforceMaintenance middleware', () => {
  beforeEach(() => {
    resetAll();
    resetMiddlewareMocks();
  });

  it('calls next when maintenance mode is off', async () => {
    AppSettings.findOne.mockResolvedValue({ maintenanceMode: false });
    const next = makeNext();

    await enforceMaintenanceMode(makeMiddlewareReq({ path: '/api/properties' }), makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next when maintenance mode is on and user is admin', async () => {
    AppSettings.findOne.mockResolvedValue({ maintenanceMode: true, maintenanceMessage: 'Down' });
    jwt.verify.mockReturnValue({ role: 'admin' });
    const req = makeMiddlewareReq({ path: '/api/properties', headers: { authorization: 'Bearer valid-admin' } });
    const next = makeNext();

    await enforceMaintenanceMode(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('returns 503 for non-admin when maintenance mode is on', async () => {
    AppSettings.findOne.mockResolvedValue({ maintenanceMode: true, maintenanceMessage: 'Scheduled maintenance' });
    jwt.verify.mockReturnValue({ role: 'tenant' });
    const req = makeMiddlewareReq({ path: '/api/properties', headers: { authorization: 'Bearer tenant-token' } });
    const res = makeRes();

    await enforceMaintenanceMode(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, maintenanceMode: true, message: 'Scheduled maintenance' });
  });

  it('calls next for allowed public path even when maintenance is on', async () => {
    AppSettings.findOne.mockResolvedValue({ maintenanceMode: true, maintenanceMessage: 'Down' });
    const next = makeNext();

    await enforceMaintenanceMode(makeMiddlewareReq({ path: '/api/auth/login' }), makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('returns 503 when token is invalid during maintenance', async () => {
    AppSettings.findOne.mockResolvedValue({ maintenanceMode: true, maintenanceMessage: 'Down' });
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    const req = makeMiddlewareReq({ path: '/api/properties', headers: { authorization: 'Bearer bad' } });
    const res = makeRes();

    await enforceMaintenanceMode(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ success: false, maintenanceMode: true, message: 'Down' });
  });
});
