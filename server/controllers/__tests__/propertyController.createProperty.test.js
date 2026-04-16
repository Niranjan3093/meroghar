import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  createProperty,
  mockProperty,
  mockAppSettings,
  makeReq,
  makeRes,
  setupDefaultMocks,
  defaultSettings
} from './propertyTestSetup.js';

describe('propertyController createProperty', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks();
    next = jest.fn();
  });

  it('creates property with parsed geo coordinates and auto-approval settings', async () => {
    mockAppSettings.findOne.mockResolvedValue({
      ...defaultSettings,
      autoApproveProperties: true,
      maxPropertiesPerHost: 5
    });

    mockProperty.countDocuments.mockResolvedValue(1);
    mockProperty.create.mockResolvedValue({ _id: 'p10', title: 'Apartment' });

    const userSave = jest.fn().mockResolvedValue(true);
    const req = makeReq({
      body: {
        title: 'Apartment',
        latitude: '27.7172',
        longitude: '85.3240'
      },
      user: {
        id: 'host-1',
        _id: 'host-1',
        name: 'Host One',
        properties: [],
        save: userSave
      }
    });
    const res = makeRes();

    await createProperty(req, res, next);

    expect(mockProperty.countDocuments).toHaveBeenCalledWith({ host: 'host-1' });
    expect(mockProperty.create).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'host-1',
        verificationStatus: 'verified',
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [85.324, 27.7172]
        }
      })
    );
    expect(userSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts location.coordinates geo payload when valid', async () => {
    mockProperty.countDocuments.mockResolvedValue(0);
    mockProperty.create.mockResolvedValue({ _id: 'p11', title: 'Geo House' });

    const req = makeReq({
      body: {
        title: 'Geo House',
        location: {
          coordinates: ['85.40', '27.70']
        }
      },
      user: {
        id: 'host-2',
        _id: 'host-2',
        name: 'Host Two',
        properties: [],
        save: jest.fn().mockResolvedValue(true)
      }
    });
    const res = makeRes();

    await createProperty(req, res, next);

    expect(mockProperty.create).toHaveBeenCalledWith(
      expect.objectContaining({
        location: {
          type: 'Point',
          coordinates: [85.4, 27.7]
        }
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when host exceeds property limit', async () => {
    mockAppSettings.findOne.mockResolvedValue({
      ...defaultSettings,
      maxPropertiesPerHost: 2,
      autoApproveProperties: false
    });
    mockProperty.countDocuments.mockResolvedValue(2);

    const req = makeReq({
      body: { title: 'Limit Reached', latitude: '27.7', longitude: '85.3' },
      user: {
        id: 'host-3',
        _id: 'host-3',
        name: 'Host Three',
        properties: [],
        save: jest.fn().mockResolvedValue(true)
      }
    });
    const res = makeRes();

    await createProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('You have reached the maximum limit of 2 properties.');
  });

  it('returns 400 when geo location is missing or invalid', async () => {
    mockProperty.countDocuments.mockResolvedValue(0);

    const req = makeReq({
      body: {
        title: 'No Map Point',
        latitude: 'invalid',
        longitude: '85.3'
      },
      user: {
        id: 'host-4',
        _id: 'host-4',
        name: 'Host Four',
        properties: [],
        save: jest.fn().mockResolvedValue(true)
      }
    });
    const res = makeRes();

    await createProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Please mark the property location on the map');
  });
});
