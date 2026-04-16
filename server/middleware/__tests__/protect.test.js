import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  jwt,
  User,
  AppSettings,
  makeRes,
  makeMiddlewareReq,
  makeNext,
  resetAll,
  resetMiddlewareMocks,
  protect
} from '../../tests/setup.js';

describe('protect middleware', () => {
  beforeEach(() => {
    resetAll();
    resetMiddlewareMocks();
    AppSettings.findOne.mockResolvedValue({ requireEmailVerification: false });
  });

  it('calls next and sets req.user when token is valid', async () => {
    const user = { _id: 'u1', role: 'tenant', isBanned: false, isActive: true, isVerified: true };
    jwt.verify.mockReturnValue({ id: 'u1' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const req = makeMiddlewareReq({ headers: { authorization: 'Bearer good-token' } });
    const res = makeRes();
    const next = makeNext();

    await protect(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 when token is missing', async () => {
    const res = makeRes();
    const next = makeNext();
    await protect(makeMiddlewareReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next.mock.calls[0][0].message).toBe('Not authorized, no token');
  });

  it('returns 401 when token verification fails', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const res = makeRes();
    const next = makeNext();
    await protect(makeMiddlewareReq({ headers: { authorization: 'Bearer bad-token' } }), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next.mock.calls[0][0].message).toBe('Not authorized, token failed');
  });

  it('returns 403 when user is banned', async () => {
    jwt.verify.mockReturnValue({ id: 'u2' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ isBanned: true, banReason: 'spam' }) });
    const res = makeRes();
    const next = makeNext();
    await protect(makeMiddlewareReq({ headers: { authorization: 'Bearer good-token' } }), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next.mock.calls[0][0].message).toContain('Account has been banned');
  });

  it('returns 401 when verified user is required but account is not verified', async () => {
    AppSettings.findOne.mockResolvedValue({ requireEmailVerification: true });
    jwt.verify.mockReturnValue({ id: 'u3' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ isBanned: false, isActive: true, isVerified: false }) });
    const res = makeRes();
    const next = makeNext();
    await protect(makeMiddlewareReq({ headers: { authorization: 'Bearer good-token' } }), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next.mock.calls[0][0].message).toBe('Please verify your account');
  });
});
