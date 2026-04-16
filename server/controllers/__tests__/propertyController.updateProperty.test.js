import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  updateProperty,
  mockProperty,
  makeReq,
  makeRes,
  setupDefaultMocks,
  mockNotifyPendingProperty
} from './propertyTestSetup.js';

describe('propertyController updateProperty', () => {
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
      user: { id: 'host-1', role: 'host' },
      body: { title: 'Updated' }
    });
    const res = makeRes();

    await updateProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next.mock.calls[0][0].message).toBe('Property not found');
  });

  it('returns 403 for non-owner non-admin user', async () => {
    mockProperty.findById.mockResolvedValue({
      host: { toString: () => 'host-owner' },
      verificationStatus: 'pending',
      rejectionEditCount: 0
    });

    const req = makeReq({
      params: { id: 'p1' },
      user: { id: 'other-user', role: 'host' },
      body: { title: 'Should Fail' }
    });
    const res = makeRes();

    await updateProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next.mock.calls[0][0].message).toBe('Not authorized to update this property');
  });

  it('returns 400 when non-admin tries to edit approved property', async () => {
    mockProperty.findById.mockResolvedValue({
      host: { toString: () => 'host-1' },
      verificationStatus: 'verified',
      rejectionEditCount: 0
    });

    const req = makeReq({
      params: { id: 'p2' },
      user: { id: 'host-1', role: 'host' },
      body: { title: 'Blocked Edit' }
    });
    const res = makeRes();

    await updateProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next.mock.calls[0][0].message).toBe('Cannot edit an approved property');
  });

  it('returns 400 when location update attempts to remove/invalid geo location', async () => {
    mockProperty.findById.mockResolvedValue({
      host: { toString: () => 'host-2' },
      verificationStatus: 'pending',
      rejectionEditCount: 0
    });

    const req = makeReq({
      params: { id: 'p3' },
      user: { id: 'host-2', role: 'host' },
      body: { latitude: 'bad', longitude: '85.3' }
    });
    const res = makeRes();

    await updateProperty(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next.mock.calls[0][0].message).toBe('Property location is required and cannot be removed');
  });

  it('resubmits rejected property and notifies admins', async () => {
    mockProperty.findById.mockResolvedValue({
      host: { toString: () => 'host-3' },
      verificationStatus: 'rejected',
      rejectionEditCount: 1
    });
    mockProperty.findByIdAndUpdate.mockResolvedValue({
      _id: 'p4',
      title: 'Resubmitted Property'
    });

    const req = makeReq({
      params: { id: 'p4' },
      user: {
        id: 'host-3',
        _id: 'host-3',
        role: 'host',
        name: 'Host Three'
      },
      body: { title: 'Updated title' }
    });
    const res = makeRes();

    await updateProperty(req, res, next);

    expect(mockProperty.findByIdAndUpdate).toHaveBeenCalledWith(
      'p4',
      expect.objectContaining({
        verificationStatus: 'pending',
        status: 'pending',
        rejectionEditCount: 2,
        rejectionReason: null
      }),
      { new: true, runValidators: true }
    );
    expect(mockNotifyPendingProperty).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ _id: 'p4' })
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
