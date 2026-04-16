import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import Lease from '../../models/Lease.js';
import Property from '../../models/Property.js';
import {
  setTestEnv,
  connectTestDb,
  cleanupTestDb,
  seedMinimalData,
  createTestApp
} from './testUtils.js';

const sendEmail = jest.fn().mockResolvedValue(true);
const verifyKhaltiPayment = jest.fn();
const initiateKhaltiPayment = jest.fn();
jest.unstable_mockModule('../../utils/email.js', () => ({ sendEmail }));
jest.unstable_mockModule('../../utils/khalti.js', () => ({
  validateKhaltiConfig: jest.fn().mockReturnValue({ valid: true }),
  getKhaltiPublicConfig: jest.fn().mockReturnValue({ enabled: true }),
  initiateKhaltiPayment,
  verifyKhaltiPayment
}));

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
  const seeded = await seedMinimalData();
  propertyId = seeded.property._id.toString();
});

afterAll(async () => {
  await cleanupTestDb();
});

describe('Payment Flow Integration', () => {
  it('logs in tenant/host and creates + approves lease request', async () => {
    const t = await request(app).post('/api/auth/login').send({ email: 'tenant.flow@example.com', password: 'Password123' });
    const h = await request(app).post('/api/auth/login').send({ email: 'host.flow@example.com', password: 'Password123' });
    tenantToken = t.body.data.token;
    hostToken = h.body.data.token;
    const created = await request(app)
      .post('/api/lease-requests')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ propertyId, proposedMoveIn: '2026-06-15', proposedDuration: 'yearly', message: 'Please approve' });
    leaseRequestId = created.body.data._id;
    const approved = await request(app)
      .put(`/api/lease-requests/${leaseRequestId}/approve`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ message: 'Approved' });
    expect(approved.status).toBe(200);
  });

  it('initiates Khalti payment with HTTP 200', async () => {
    initiateKhaltiPayment.mockResolvedValue({ pidx: 'P123', payment_url: 'https://khalti.test/pay' });
    const res = await request(app)
      .post('/api/payments/khalti/initiate')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ amount: 50000, productIdentity: leaseRequestId, productName: 'Security Deposit' });
    expect(res.status).toBe(200);
  });

  it('returns non-success for failed Khalti verify', async () => {
    verifyKhaltiPayment.mockResolvedValue({ verified: false, status: 'Pending' });
    const res = await request(app)
      .post('/api/payments/khalti/verify')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ pidx: 'P123' });
    expect(res.status).toBe(202);
  });

  it('verifies Khalti payment successfully with HTTP 200', async () => {
    verifyKhaltiPayment.mockResolvedValue({ verified: true, status: 'Completed' });
    const res = await request(app)
      .post('/api/payments/khalti/verify')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ pidx: 'P123' });
    expect(res.status).toBe(200);
  });

  it('pays deposit, creates lease, and marks property rented', async () => {
    const pay = await request(app)
      .post(`/api/lease-requests/${leaseRequestId}/pay-deposit`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ paymentMethod: 'khalti', transactionId: 'TXN-123', paymentGatewayResponse: { pidx: 'P123' } });
    const lease = await Lease.findOne({ property: propertyId, tenant: pay.body?.data?.tenant?._id });
    const property = await Property.findById(propertyId);
    expect(pay.status).toBe(200);
    expect(lease).toBeTruthy();
    expect(property.status).toBe('rented');
  });
});
