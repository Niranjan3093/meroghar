import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  LeaseRequest,
  Property,
  getRouteHandler,
  createPopulateChain,
  makeReq,
  makeRes,
  resetAll,
  notifyLeaseRequest
} from '../../tests/setup.js';

describe('createLeaseRequest', () => {
  const handler = getRouteHandler('post', '/');

  beforeEach(() => resetAll());

  it('creates lease request successfully', async () => {
    const property = { _id: 'p1', title: 'Flat', status: 'active', verificationStatus: 'verified', rent: 12000, securityDeposit: 24000, leaseDuration: 'yearly', host: { _id: 'h1' } };
    const created = { _id: 'lr1' };
    const populated = { _id: 'lr1', property };
    Property.findById.mockReturnValue(createPopulateChain(property, 1));
    LeaseRequest.findOne.mockResolvedValue(null);
    LeaseRequest.create.mockResolvedValue(created);
    LeaseRequest.findById.mockReturnValue(createPopulateChain(populated, 3));
    const req = makeReq({ body: { propertyId: 'p1', proposedMoveIn: '2026-05-10', proposedDuration: 'yearly' }, user: { _id: 't1', name: 'Tenant' } });
    const res = makeRes();

    await handler(req, res);

    expect(LeaseRequest.create).toHaveBeenCalled();
    expect(notifyLeaseRequest).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: populated });
  });

  it('returns 404 when property is not found', async () => {
    Property.findById.mockReturnValue(createPopulateChain(null, 1));
    const res = makeRes();

    await handler(makeReq({ body: { propertyId: 'missing' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Property not found' });
  });

  it('returns 400 when property is not available for rent', async () => {
    const property = { _id: 'p2', status: 'rented', verificationStatus: 'verified', host: { _id: 'h1' } };
    Property.findById.mockReturnValue(createPopulateChain(property, 1));
    const res = makeRes();

    await handler(makeReq({ body: { propertyId: 'p2' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Property is not available for rent' });
  });

  it('returns 400 when duplicate active request exists', async () => {
    const property = { _id: 'p3', status: 'active', verificationStatus: 'verified', host: { _id: 'h1' } };
    Property.findById.mockReturnValue(createPopulateChain(property, 1));
    LeaseRequest.findOne.mockResolvedValue({ _id: 'existing' });
    const res = makeRes();

    await handler(makeReq({ body: { propertyId: 'p3' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'You already have an active request for this property' });
  });

  it('returns 500 when creation throws', async () => {
    const property = { _id: 'p4', status: 'active', verificationStatus: 'verified', host: { _id: 'h1' }, leaseDuration: 'yearly', rent: 1, securityDeposit: 1 };
    Property.findById.mockReturnValue(createPopulateChain(property, 1));
    LeaseRequest.findOne.mockResolvedValue(null);
    LeaseRequest.create.mockRejectedValue(new Error('db fail'));
    const res = makeRes();

    await handler(makeReq({ body: { propertyId: 'p4', proposedMoveIn: '2026-05-10' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to create lease request' });
  });
});
