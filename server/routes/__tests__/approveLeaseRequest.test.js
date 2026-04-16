import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  LeaseRequest,
  getRouteHandler,
  createPopulateChain,
  makeReq,
  makeRes,
  resetAll,
  notifyLeaseRequestResponse
} from '../../tests/setup.js';

describe('approveLeaseRequest', () => {
  const handler = getRouteHandler('put', '/:id/approve');

  beforeEach(() => resetAll());

  it('approves pending request successfully', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const reqDoc = { _id: 'lr1', status: 'pending', securityDeposit: 50000, host: { toString: () => 'h1' }, tenant: { _id: 't1' }, property: { _id: 'p1', title: 'Flat' }, conversation: null, save };
    const populated = { _id: 'lr1', status: 'approved' };
    LeaseRequest.findById.mockReturnValueOnce(createPopulateChain(reqDoc, 2)).mockReturnValueOnce(createPopulateChain(populated, 3));
    const req = makeReq({ params: { id: 'lr1' }, body: {}, user: { _id: 'h1', name: 'Host' } });
    const res = makeRes();

    await handler(req, res);

    expect(reqDoc.status).toBe('approved');
    expect(save).toHaveBeenCalled();
    expect(notifyLeaseRequestResponse).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ approved: true }));
    expect(res.json).toHaveBeenCalledWith({ success: true, data: populated });
  });

  it('returns 404 when lease request not found', async () => {
    LeaseRequest.findById.mockReturnValue(createPopulateChain(null, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'missing' }, user: { _id: 'h1' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Lease request not found' });
  });

  it('returns 403 when non-host user tries to approve', async () => {
    const reqDoc = { status: 'pending', host: { toString: () => 'real-host' } };
    LeaseRequest.findById.mockReturnValue(createPopulateChain(reqDoc, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr2' }, user: { _id: 'other' } }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Only the host can approve this request' });
  });

  it('returns 400 for already processed request', async () => {
    const reqDoc = { status: 'rejected', host: { toString: () => 'h1' } };
    LeaseRequest.findById.mockReturnValue(createPopulateChain(reqDoc, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr3' }, user: { _id: 'h1' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Request has already been processed' });
  });

  it('returns 500 when save fails', async () => {
    const reqDoc = { status: 'pending', securityDeposit: 50000, host: { toString: () => 'h1' }, save: jest.fn().mockRejectedValue(new Error('save fail')) };
    LeaseRequest.findById.mockReturnValue(createPopulateChain(reqDoc, 2));
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr4' }, user: { _id: 'h1' } }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to approve lease request' });
  });
});
