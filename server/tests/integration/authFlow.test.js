import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import User from '../../models/User.js';
import {
  setTestEnv,
  connectTestDb,
  cleanupTestDb,
  seedMinimalData,
  createTestApp
} from './testUtils.js';

const sendEmail = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule('../../utils/email.js', () => ({ sendEmail }));

let app;
let tenantToken;

beforeAll(async () => {
  setTestEnv();
  const { default: authRoutes } = await import('../../routes/authRoutes.js');
  const { default: propertyRoutes } = await import('../../routes/propertyRoutes.js');
  const { default: leaseRequestRoutes } = await import('../../routes/leaseRequestRoutes.js');
  const { default: paymentRoutes } = await import('../../routes/paymentRoutes.js');
  app = createTestApp({ authRoutes, propertyRoutes, leaseRequestRoutes, paymentRoutes });
  await connectTestDb();
  await seedMinimalData();
});

afterAll(async () => {
  await cleanupTestDb();
});

describe('Auth Flow Integration', () => {
  it('registers tenant with HTTP 201', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Flow Tenant',
      email: 'newtenant.flow@example.com',
      password: 'Password123',
      role: 'tenant'
    });
    expect(res.status).toBe(201);
  });

  it('returns 401 for login before verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newtenant.flow@example.com', password: 'Password123' });
    expect(res.status).toBe(401);
  });

  it('verifies tenant email with HTTP 200', async () => {
    const tenant = await User.findOne({ email: 'newtenant.flow@example.com' });
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: tenant.email, token: tenant.verificationToken });
    expect(res.status).toBe(200);
  });

  it('logs in tenant and stores JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newtenant.flow@example.com', password: 'Password123' });
    expect(res.status).toBe(200);
    tenantToken = res.body?.data?.token;
    expect(tenantToken).toBeTruthy();
  });

  it('uses JWT to access protected me endpoint', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
