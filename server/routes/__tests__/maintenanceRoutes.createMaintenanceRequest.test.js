import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  mockLease,
  mockMaintenance,
  mockProperty,
  mockNotifyMaintenanceRequest,
  getRouteHandler,
  createPopulateChain,
  makeReq,
  makeRes,
  resetMaintenanceRouteMocks
} from '../../tests/maintenanceRoutesSetup.js';

describe('maintenanceRoutes createMaintenanceRequest', () => {
  const createMaintenanceRequest = getRouteHandler('post', '/');

  beforeEach(() => {
    resetMaintenanceRouteMocks();
  });

  it('UT-M01 creates request for tenant with active lease', async () => {
    const lease = { _id: 'lease-1' };
    const created = { _id: 'm1' };
    const populated = {
      _id: 'm1',
      title: 'Leaking tap',
      property: { _id: 'p1', title: 'Flat' },
      reportedBy: { _id: 't1', name: 'Tenant' }
    };
    const propertyData = {
      _id: 'p1',
      title: 'Flat',
      host: { _id: 'h1', name: 'Host' }
    };

    mockLease.findOne.mockResolvedValue(lease);
    mockMaintenance.create.mockResolvedValue(created);
    mockMaintenance.findById.mockReturnValue(createPopulateChain(populated, 2));
    mockProperty.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(propertyData)
    });

    const req = makeReq({
      body: {
        title: 'Leaking tap',
        description: 'Water leakage in kitchen tap',
        category: 'plumbing',
        priority: 'high',
        property: 'p1'
      },
      files: [{ path: 'img-url', filename: 'img-1' }],
      user: { _id: 't1', name: 'Tenant', role: 'tenant' }
    });
    const res = makeRes();

    await createMaintenanceRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockNotifyMaintenanceRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        hostId: 'h1',
        tenantId: 't1',
        title: 'Leaking tap',
        maintenanceId: 'm1'
      })
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: populated });
  });

  it('UT-M02 blocks tenant without active lease', async () => {
    mockLease.findOne.mockResolvedValue(null);

    const req = makeReq({
      body: {
        title: 'Broken switch',
        description: 'Switch not working',
        category: 'electrical',
        priority: 'medium',
        property: 'p1'
      },
      user: { _id: 't1', role: 'tenant' }
    });
    const res = makeRes();

    await createMaintenanceRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You can only submit maintenance requests for properties you are renting'
    });
  });
});
