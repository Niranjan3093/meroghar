import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  resetPassword,
  mockUser,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './authTestSetup.js';

describe('authController resetPassword', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns 400 for invalid/expired reset token', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const req = makeReq({
      body: { email: 'reset@example.com', password: 'newPass123' },
      params: { token: 'bad-token' }
    });
    const res = makeRes();

    await resetPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next.mock.calls[0][0].message).toBe('Invalid or expired reset token');
  });

  it('resets password and clears reset fields on success', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      password: 'old-password',
      resetPasswordToken: 'token-1',
      resetPasswordExpire: Date.now() + 60000,
      save
    };
    mockUser.findOne.mockResolvedValue(dbUser);

    const req = makeReq({
      body: { email: 'reset@example.com', password: 'newPass123' },
      params: { token: 'token-1' }
    });
    const res = makeRes();

    await resetPassword(req, res, next);

    expect(dbUser.password).toBe('newPass123');
    expect(dbUser.resetPasswordToken).toBeUndefined();
    expect(dbUser.resetPasswordExpire).toBeUndefined();
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password reset successfully'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards persistence failure to next', async () => {
    const dbUser = {
      save: jest.fn().mockRejectedValue(new Error('DB write failed'))
    };
    mockUser.findOne.mockResolvedValue(dbUser);

    const req = makeReq({
      body: { email: 'reset@example.com', password: 'newPass123' },
      params: { token: 'ok-token' }
    });
    const res = makeRes();

    await resetPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('DB write failed');
  });
});
