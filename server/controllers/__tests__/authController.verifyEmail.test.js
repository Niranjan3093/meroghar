import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  verifyEmail,
  mockUser,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './authTestSetup.js';

describe('authController verifyEmail', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns 400 for invalid or expired token', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const req = makeReq({ body: { email: 'x@example.com', token: '000000' } });
    const res = makeRes();

    await verifyEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next.mock.calls[0][0].message).toBe('Invalid or expired verification token');
  });

  it('verifies email, clears token fields, and returns auth token', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      _id: 'u6',
      name: 'Verified',
      email: 'verified@example.com',
      role: 'host',
      emailVerified: false,
      isVerified: false,
      verificationToken: '333333',
      verificationTokenExpire: Date.now() + 10000,
      save,
      generateToken: jest.fn().mockReturnValue('verified-jwt')
    };
    mockUser.findOne.mockResolvedValue(dbUser);

    const req = makeReq({ body: { email: 'verified@example.com', token: '333333' } });
    const res = makeRes();

    await verifyEmail(req, res, next);

    expect(dbUser.emailVerified).toBe(true);
    expect(dbUser.isVerified).toBe(true);
    expect(dbUser.verificationToken).toBeUndefined();
    expect(dbUser.verificationTokenExpire).toBeUndefined();
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Email verified successfully',
        data: expect.objectContaining({ token: 'verified-jwt' })
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
