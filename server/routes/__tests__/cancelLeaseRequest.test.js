import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  LeaseRequest,
  getRouteHandler,
  createPopulateChain,
  makeReq,
  makeRes,
  resetAll
} from '../../tests/setup.js';

describe('cancelLeaseRequest', () => {
  const handler = getRouteHandler('put', '/:id/cancel');

  beforeEach(() => resetAll());

  it('cancels pending request successfully', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const reqDoc = { _id: 'lr1', status: 'pending', tenant: { toString: () => 't1' }, host: { toString: () => 'h1' }, save };
    const populated = { _id: 'lr1', status: 'cancelled' };
    LeaseRequest.findById.mockResolvedValueOnce(reqDoc).mockReturnValueOnce(createPopulateChain(populated, 3));
    const req = makeReq({ params: { id: 'lr1' }, body: { reason: 'Changed plans' }, user: { _id: 't1' } });
    const res = makeRes();

    await handler(req, res);

    expect(reqDoc.status).toBe('cancelled');
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: populated });
  });

  it('returns 404 when lease request not found', async () => {
    LeaseRequest.findById.mockResolvedValue(null);
    const res = makeRes();

    await handler(makeReq({ params: { id: 'missing' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Lease request not found' });
  });

  it('returns 403 when user is neither tenant nor host', async () => {
    const reqDoc = { status: 'pending', tenant: { toString: () => 't1' }, host: { toString: () => 'h1' } };
    LeaseRequest.findById.mockResolvedValue(reqDoc);
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr2' }, user: { _id: 'other' } }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
  });

  it('returns 400 when request is in invalid state', async () => {
    const reqDoc = { status: 'completed', tenant: { toString: () => 't1' }, host: { toString: () => 'h1' } };
    LeaseRequest.findById.mockResolvedValue(reqDoc);
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr3' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Cannot cancel this request' });
  });

  it('returns 500 when save fails', async () => {
    const reqDoc = { status: 'pending', tenant: { toString: () => 't1' }, host: { toString: () => 'h1' }, save: jest.fn().mockRejectedValue(new Error('save fail')) };
    LeaseRequest.findById.mockResolvedValue(reqDoc);
    const res = makeRes();

    await handler(makeReq({ params: { id: 'lr4' }, user: { _id: 't1' } }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to cancel lease request' });
  });
});
