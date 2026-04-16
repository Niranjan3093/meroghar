import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  getProperty,
  mockProperty,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './propertyTestSetup.js';

describe('propertyController getProperty', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns 404 when property does not exist', async () => {
    const populateCurrentLease = jest.fn().mockResolvedValue(null);
    const populateHost = jest.fn().mockReturnValue({ populate: populateCurrentLease });
    mockProperty.findById.mockReturnValue({ populate: populateHost });

    const req = makeReq({ params: { id: 'missing-id' } });
    const res = makeRes();

    await getProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Property not found');
  });

  it('increments views and returns the property', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const property = {
      _id: 'p1',
      views: 7,
      save
    };

    const populateCurrentLease = jest.fn().mockResolvedValue(property);
    const populateHost = jest.fn().mockReturnValue({ populate: populateCurrentLease });
    mockProperty.findById.mockReturnValue({ populate: populateHost });

    const req = makeReq({ params: { id: 'p1' } });
    const res = makeRes();

    await getProperty(req, res, next);

    expect(property.views).toBe(8);
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: property
    });
    expect(next).not.toHaveBeenCalled();
  });
});
