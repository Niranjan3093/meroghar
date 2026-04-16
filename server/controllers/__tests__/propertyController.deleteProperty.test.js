import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  deleteProperty,
  mockProperty,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './propertyTestSetup.js';

describe('propertyController deleteProperty', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns 404 when property does not exist', async () => {
    mockProperty.findById.mockResolvedValue(null);

    const req = makeReq({
      params: { id: 'missing-property' },
      user: { id: 'host-1', role: 'host' }
    });
    const res = makeRes();

    await deleteProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Property not found');
  });

  it('returns 403 for non-owner non-admin user', async () => {
    mockProperty.findById.mockResolvedValue({
      host: { toString: () => 'owner-1' }
    });

    const req = makeReq({
      params: { id: 'p7' },
      user: { id: 'other-user', role: 'host' }
    });
    const res = makeRes();

    await deleteProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next.mock.calls[0][0].message).toBe('Not authorized to delete this property');
  });

  it('deletes property for owner and returns success response', async () => {
    const deleteOne = jest.fn().mockResolvedValue(true);
    mockProperty.findById.mockResolvedValue({
      host: { toString: () => 'owner-2' },
      deleteOne
    });

    const req = makeReq({
      params: { id: 'p8' },
      user: { id: 'owner-2', role: 'host' }
    });
    const res = makeRes();

    await deleteProperty(req, res, next);

    expect(deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Property removed'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
