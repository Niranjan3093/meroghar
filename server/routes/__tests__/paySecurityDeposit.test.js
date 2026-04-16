import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  LeaseRequest,
  Lease,
  Property,
  Payment,
  getRouteHandler,
  createPopulateChain,
  makeReq,
  makeRes,
  resetAll,
  khalti
} from '../../tests/setup.js';

describe('paySecurityDeposit', () => {
  const handler = getRouteHandler('post', '/:id/pay-deposit');

  beforeEach(() => resetAll());

  it('completes payment and creates lease successfully', async () => {
    const payment = { _id: 'pay1', save: jest.fn().mockResolvedValue(true) };
    const lease = { _id: 'lease1' };
    const reqDoc = { _id: 'lr1', tenant: { toString: () => 't1' }, host: { _id: 'h1', toString: () => 'h1' }, property: { _id: 'p1', title: 'Flat' }, status: 'approved', securityDeposit: 20000, proposedMoveIn: new Date('2026-05-01'), proposedDuration: 'monthly', monthlyRent: 10000, save: jest.fn().mockResolvedValue(true) };
    const populated = { _id: 'lr1', status: 'completed', securityDepositPaid: true };
    LeaseRequest.findById.mockReturnValueOnce(createPopulateChain(reqDoc, 2)).mockReturnValueOnce(createPopulateChain(populated, 4));
    Payment.create.mockResolvedValue(payment);
    Lease.create.mockResolvedValue(lease);
    Property.findByIdAndUpdate.mockResolvedValue(true);
    const req = makeReq({ params: { id: 'lr1' }, body: { paymentMethod: 'khalti', transactionId: 'txn1', paymentGatewayResponse: { pidx: 'x' } }, user: { _id: 't1', name: 'Tenant' } });
    const res = makeRes();

    await handler(req, res);

    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'khalti', status: 'completed' }));
    expect(Lease.create).toHaveBeenCalled();
    expect(Property.findByIdAndUpdate).toHaveBeenCalledWith('p1', expect.objectContaining({ status: 'rented' }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Security deposit paid successfully! Lease has been created.' }));
  });

  it('returns 404 when lease request not found', async () => {
    LeaseRequest.findById.mockReturnValue(createPopulateChain(null, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'missing' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Lease request not found' });
  });

  it('returns 403 when non-tenant user attempts payment', async () => {
    const reqDoc = { tenant: { toString: () => 'real-tenant' }, status: 'approved' };
    LeaseRequest.findById.mockReturnValue(createPopulateChain(reqDoc, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr2' }, user: { _id: 'other' } }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Only the tenant can pay for this request' });
  });

  it('returns 400 when lease request is not approved', async () => {
    const reqDoc = { tenant: { toString: () => 't1' }, status: 'pending' };
    LeaseRequest.findById.mockReturnValue(createPopulateChain(reqDoc, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr3' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Lease request is not approved' });
  });

  it('returns 500 when payment processing fails', async () => {
    khalti.verifyKhaltiPayment.mockResolvedValue({ verified: false });
    const reqDoc = { tenant: { toString: () => 't1' }, host: { _id: 'h1', toString: () => 'h1' }, property: { _id: 'p1', title: 'Flat' }, status: 'approved', securityDeposit: 20000, proposedMoveIn: new Date(), proposedDuration: 'yearly', monthlyRent: 10000, save: jest.fn().mockResolvedValue(true) };
    LeaseRequest.findById.mockReturnValue(createPopulateChain(reqDoc, 2));
    Payment.create.mockRejectedValue(new Error('gateway failed'));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr4' }, body: { paymentMethod: 'khalti', transactionId: 'x' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to process payment' });
  });
});
