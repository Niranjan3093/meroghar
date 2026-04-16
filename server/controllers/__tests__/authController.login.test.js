import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  login,
  mockUser,
  mockSendEmail,
  mockGetAppSettings,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './authTestSetup.js';

describe('authController login', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns 401 when user is not found', async () => {
    const select = jest.fn().mockResolvedValue(null);
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'missing@example.com', password: '123456' } });
    const res = makeRes();

    await login(req, res, next);

    expect(select).toHaveBeenCalledWith('+password');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next.mock.calls[0][0].message).toBe('Invalid credentials');
  });

  it('returns 429 when account is locked', async () => {
    const select = jest.fn().mockResolvedValue({
      lockUntil: Date.now() + 60000
    });
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'locked@example.com', password: 'bad' } });
    const res = makeRes();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(next.mock.calls[0][0].message).toContain('Account temporarily locked');
  });

  it('increments failed attempts and saves on invalid password', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      failedLoginAttempts: 1,
      matchPassword: jest.fn().mockResolvedValue(false),
      save,
      email: 'user@example.com'
    };
    const select = jest.fn().mockResolvedValue(dbUser);
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'user@example.com', password: 'bad' } });
    const res = makeRes();

    await login(req, res, next);

    expect(dbUser.failedLoginAttempts).toBe(2);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next.mock.calls[0][0].message).toBe('Invalid credentials');
  });

  it('sets lockUntil when failed attempts reach maxLoginAttempts', async () => {
    mockGetAppSettings.mockResolvedValue({
      platformName: 'MeroGhar',
      maxLoginAttempts: 3,
      maintenanceMode: false,
      requireEmailVerification: false,
      adminEmailNotifications: { maxLoginAttemptsExceeded: false }
    });

    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      failedLoginAttempts: 2,
      matchPassword: jest.fn().mockResolvedValue(false),
      save,
      email: 'user@example.com'
    };
    const select = jest.fn().mockResolvedValue(dbUser);
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'user@example.com', password: 'bad' } });
    const res = makeRes();

    await login(req, res, next);

    expect(dbUser.failedLoginAttempts).toBe(3);
    expect(dbUser.lockUntil).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('blocks unverified users and resends verification code when required', async () => {
    mockGetAppSettings.mockResolvedValue({
      platformName: 'MeroGhar',
      maxLoginAttempts: 5,
      maintenanceMode: false,
      requireEmailVerification: true,
      adminEmailNotifications: { maxLoginAttemptsExceeded: false }
    });

    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      _id: 'u4',
      email: 'verifyme@example.com',
      role: 'tenant',
      isVerified: false,
      matchPassword: jest.fn().mockResolvedValue(true),
      generateVerificationToken: jest.fn().mockReturnValue('654321'),
      save
    };
    const select = jest.fn().mockResolvedValue(dbUser);
    mockUser.findOne.mockReturnValue({ select });
    mockSendEmail.mockResolvedValue(true);

    const req = makeReq({ body: { email: 'verifyme@example.com', password: 'ok' } });
    const res = makeRes();

    await login(req, res, next);

    expect(dbUser.generateVerificationToken).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'verifyme@example.com',
        subject: 'Verify Your Email - MeroGhar'
      })
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].code).toBe('EMAIL_NOT_VERIFIED');
    expect(next.mock.calls[0][0].verificationSent).toBe(true);
  });

  it('blocks login during maintenance for non-admin users', async () => {
    mockGetAppSettings.mockResolvedValue({
      platformName: 'MeroGhar',
      maxLoginAttempts: 5,
      maintenanceMode: true,
      requireEmailVerification: false,
      adminEmailNotifications: { maxLoginAttemptsExceeded: false }
    });

    const dbUser = {
      role: 'tenant',
      isBanned: false,
      failedLoginAttempts: 0,
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
    const select = jest.fn().mockResolvedValue(dbUser);
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'tenant@example.com', password: 'ok' } });
    const res = makeRes();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next.mock.calls[0][0].message).toBe('Only admin can login during maintenance mode');
  });

  it('blocks banned users', async () => {
    const dbUser = {
      role: 'tenant',
      isBanned: true,
      banReason: 'Policy violation',
      failedLoginAttempts: 0,
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
    const select = jest.fn().mockResolvedValue(dbUser);
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'banned@example.com', password: 'ok' } });
    const res = makeRes();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next.mock.calls[0][0].message).toBe('Account banned: Policy violation');
  });

  it('returns token and user data on successful login', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const dbUser = {
      _id: 'u5',
      name: 'Active User',
      email: 'active@example.com',
      role: 'tenant',
      avatar: 'avatar.jpg',
      isBanned: false,
      failedLoginAttempts: 3,
      matchPassword: jest.fn().mockResolvedValue(true),
      save,
      generateToken: jest.fn().mockReturnValue('jwt-token')
    };
    const select = jest.fn().mockResolvedValue(dbUser);
    mockUser.findOne.mockReturnValue({ select });

    const req = makeReq({ body: { email: 'active@example.com', password: 'goodpass' } });
    const res = makeRes();

    await login(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        id: 'u5',
        name: 'Active User',
        email: 'active@example.com',
        role: 'tenant',
        avatar: 'avatar.jpg',
        token: 'jwt-token'
      }
    });
    expect(next).not.toHaveBeenCalled();
  });
});
