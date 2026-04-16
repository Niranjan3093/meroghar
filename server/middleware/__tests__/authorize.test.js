import { describe, it, expect, beforeEach } from '@jest/globals';
import { makeRes, makeNext, makeMiddlewareReq, resetAll } from '../../tests/setup.js';
import { authorize } from '../authMiddleware.js';

describe('authorize middleware', () => {
  beforeEach(() => resetAll());

  it('calls next when user has correct role', () => {
    const req = makeMiddlewareReq({ user: { role: 'admin' } });
    const res = makeRes();
    const next = makeNext();

    authorize('admin', 'host')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('throws 403 error when user role is not allowed', () => {
    const req = makeMiddlewareReq({ user: { role: 'tenant' } });
    const res = makeRes();
    const next = makeNext();

    expect(() => authorize('admin')(req, res, next)).toThrow('is not authorized to access this route');
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows host when host role is configured', () => {
    const req = makeMiddlewareReq({ user: { role: 'host' } });
    const res = makeRes();
    const next = makeNext();

    authorize('host', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects undefined role', () => {
    const req = makeMiddlewareReq({ user: { role: undefined } });
    const res = makeRes();
    const next = makeNext();

    expect(() => authorize('admin')(req, res, next)).toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects empty role list for all users', () => {
    const req = makeMiddlewareReq({ user: { role: 'admin' } });
    const res = makeRes();
    const next = makeNext();

    expect(() => authorize()(req, res, next)).toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
