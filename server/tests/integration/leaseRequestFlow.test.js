import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import {
  setTestEnv,
  connectTestDb,
  cleanupTestDb,
  seedMinimalData,
  createTestApp
} from './testUtils.js';

jest.unstable_mockModule('../../utils/email.js', () => ({ sendEmail: jest.fn().mockResolvedValue(true) }));

let app;
let tenantToken;
let hostToken;
let propertyId;
let leaseRequestId;

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

describe('Lease Request Flow Integration', () => {
  it('logs in tenant and host and stores JWTs', async () => {
    const tenantRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tenant.flow@example.com', password: 'Password123' });
    const hostRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'host.flow@example.com', password: 'Password123' });
    tenantToken = tenantRes.body?.data?.token;
    hostToken = hostRes.body?.data?.token;
    expect(tenantRes.status).toBe(200);
    expect(hostRes.status).toBe(200);
  });

  it('tenant fetches properties with HTTP 200', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(200);
    propertyId = res.body?.data?.[0]?._id;
    expect(propertyId).toBeTruthy();
  });

  it('tenant creates lease request with HTTP 201', async () => {
    const res = await request(app)
      .post('/api/lease-requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ propertyId, proposedMoveIn: '2026-06-01', proposedDuration: 'yearly', message: 'Interested' });
    expect(res.status).toBe(201);
    leaseRequestId = res.body?.data?._id;
    expect(leaseRequestId).toBeTruthy();
  });

  it('returns 400 for duplicate active request', async () => {
    const res = await request(app)
      .post('/api/lease-requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ propertyId, proposedMoveIn: '2026-06-01', proposedDuration: 'yearly' });
    expect(res.status).toBe(400);
  });

  it('host approves request with HTTP 200', async () => {
    const res = await request(app)
      .put(`/api/lease-requests/${leaseRequestId}/approve`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ message: 'Approved' });
    expect(res.status).toBe(200);
    expect(res.body?.data?.status).toBe('approved');
  });
});
