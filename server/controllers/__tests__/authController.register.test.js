import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  register,
  mockUser,
  mockSendEmail,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './authTestSetup.js';

describe('authController register', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('registers a user and returns verificationSent=true when email is sent', async () => {
    const userDoc = {
      _id: 'u1',
      name: 'John',
      email: 'john@example.com',
      phone: '9800000000',
      role: 'tenant',
      generateVerificationToken: jest.fn().mockReturnValue('123456'),
      save: jest.fn().mockResolvedValue(true)
    };

    mockUser.findOne.mockResolvedValue(null);
    mockUser.create.mockResolvedValue(userDoc);
    mockSendEmail.mockResolvedValue(true);

    const req = makeReq({
      body: {
        name: ' John ',
        email: ' JOHN@example.com ',
        phone: ' 9800000000 ',
        password: 'password123'
      }
    });
    const res = makeRes();

    await register(req, res, next);

    expect(mockUser.findOne).toHaveBeenCalledWith({
      email: 'john@example.com',
      $or: [{ email: 'john@example.com' }, { phone: '9800000000' }]
    });
    expect(mockUser.create).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      phone: '9800000000',
      password: 'password123',
      role: 'tenant'
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: expect.objectContaining({ verificationSent: true })
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('normalizes empty phone to null and does not include $or in duplicate query', async () => {
    const userDoc = {
      _id: 'u2',
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
      role: 'tenant',
      generateVerificationToken: jest.fn().mockReturnValue('999999'),
      save: jest.fn().mockResolvedValue(true)
    };

    mockUser.findOne.mockResolvedValue(null);
    mockUser.create.mockResolvedValue(userDoc);
    mockSendEmail.mockResolvedValue(true);

    const req = makeReq({
      body: {
        name: ' Jane ',
        email: ' jane@example.com ',
        phone: '   ',
        password: 'password123'
      }
    });
    const res = makeRes();

    await register(req, res, next);

    expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing or invalid type', async () => {
    const req = makeReq({
      body: {
        name: 'No Email',
        phone: '9800000000',
        password: 'password123'
      }
    });
    const res = makeRes();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Valid email is required');
  });

  it('returns 400 when user already exists', async () => {
    mockUser.findOne.mockResolvedValue({ _id: 'existing-user' });

    const req = makeReq({
      body: {
        name: 'Existing',
        email: 'exists@example.com',
        phone: '9800000000',
        password: 'password123'
      }
    });
    const res = makeRes();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('User already exists');
  });

  it('still registers when verification email send fails', async () => {
    const userDoc = {
      _id: 'u3',
      name: 'Mail Fail',
      email: 'mailfail@example.com',
      phone: null,
      role: 'tenant',
      generateVerificationToken: jest.fn().mockReturnValue('777777'),
      save: jest.fn().mockResolvedValue(true)
    };

    mockUser.findOne.mockResolvedValue(null);
    mockUser.create.mockResolvedValue(userDoc);
    mockSendEmail.mockRejectedValue(new Error('SMTP down'));

    const req = makeReq({
      body: {
        name: 'Mail Fail',
        email: 'mailfail@example.com',
        password: 'password123'
      }
    });
    const res = makeRes();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Registration successful. Please request a new verification code.',
        data: expect.objectContaining({ verificationSent: false })
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
