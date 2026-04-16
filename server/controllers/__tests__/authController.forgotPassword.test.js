import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  forgotPassword,
  mockUser,
  mockSendEmail,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './authTestSetup.js';

describe('authController forgotPassword', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns 404 when user does not exist', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const req = makeReq({ body: { email: 'missing@example.com' } });
    const res = makeRes();

    await forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next.mock.calls[0][0].message).toBe('User not found');
  });

  it('sets reset fields and sends reset email', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      generateVerificationToken: jest.fn().mockReturnValue('111222'),
      save
    };
    mockUser.findOne.mockResolvedValue(dbUser);
    mockSendEmail.mockResolvedValue(true);

    const req = makeReq({ body: { email: 'resetme@example.com' } });
    const res = makeRes();

    await forgotPassword(req, res, next);

    expect(dbUser.resetPasswordToken).toBe('111222');
    expect(typeof dbUser.resetPasswordExpire).toBe('number');
    expect(save).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resetme@example.com',
        subject: 'Password Reset - MeroGhar'
      })
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password reset code sent to your email'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards email service failure to next', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      generateVerificationToken: jest.fn().mockReturnValue('987654'),
      save
    };
    mockUser.findOne.mockResolvedValue(dbUser);
    mockSendEmail.mockRejectedValue(new Error('Email provider failed'));

    const req = makeReq({ body: { email: 'failmail@example.com' } });
    const res = makeRes();

    await forgotPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Email provider failed');
  });
});
