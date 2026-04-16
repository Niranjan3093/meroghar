import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  getProperties,
  mockProperty,
  makeReq,
  makeRes,
  setupDefaultMocks
} from './propertyTestSetup.js';

describe('propertyController getProperties', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('returns paginated properties using default page and limit', async () => {
    const properties = [{ _id: 'p1' }, { _id: 'p2' }];
    const limit = jest.fn().mockResolvedValue(properties);
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    const populate = jest.fn().mockReturnValue({ sort });

    mockProperty.find.mockReturnValue({ populate });
    mockProperty.countDocuments.mockResolvedValue(23);

    const req = makeReq();
    const res = makeRes();

    await getProperties(req, res, next);

    expect(mockProperty.find).toHaveBeenCalledWith({
      status: 'active',
      verificationStatus: 'verified'
    });
    expect(skip).toHaveBeenCalledWith(0);
    expect(limit).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: properties,
      pagination: {
        page: 1,
        limit: 10,
        total: 23,
        pages: 3
      }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('applies filter query and pagination parameters', async () => {
    const properties = [{ _id: 'p3' }];
    const limit = jest.fn().mockResolvedValue(properties);
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    const populate = jest.fn().mockReturnValue({ sort });

    mockProperty.find.mockReturnValue({ populate });
    mockProperty.countDocuments.mockResolvedValue(6);

    const req = makeReq({
      query: {
        page: '2',
        limit: '5',
        propertyType: 'apartment',
        minRent: '10000',
        maxRent: '30000',
        city: 'Kathmandu',
        amenities: 'wifi,parking'
      }
    });
    const res = makeRes();

    await getProperties(req, res, next);

    const query = mockProperty.find.mock.calls[0][0];

    expect(query.status).toBe('active');
    expect(query.verificationStatus).toBe('verified');
    expect(query.propertyType).toBe('apartment');
    expect(query.rent).toEqual({ $gte: 10000, $lte: 30000 });
    expect(query.amenities).toEqual({ $all: ['wifi', 'parking'] });
    expect(query['address.city']).toBeInstanceOf(RegExp);
    expect(query['address.city'].source).toBe('Kathmandu');

    expect(skip).toHaveBeenCalledWith(5);
    expect(limit).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: properties,
        pagination: {
          page: 2,
          limit: 5,
          total: 6,
          pages: 2
        }
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
