import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  mockMaintenance,
  mockNotifyMaintenanceResolved,
  mockNotifyMaintenanceUpdate,
  getRouteHandler,
  createPopulateChain,
  makeReq,
  makeRes,
  resetMaintenanceRouteMocks
} from '../../tests/maintenanceRoutesSetup.js';

describe('maintenanceRoutes updateMaintenanceStatus', () => {
  const updateMaintenanceStatus = getRouteHandler('put', '/:id');

  beforeEach(() => {
    resetMaintenanceRouteMocks();
  });

  it('UT-M03 host updates status to in-progress', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const maintenance = {
      _id: 'm3',
      title: 'Window repair',
      status: 'pending',
      startedAt: null,
      save
    };
    const updated = {
      _id: 'm3',
      title: 'Window repair',
      status: 'in-progress',
      property: { _id: 'p1', title: 'Flat' },
      reportedBy: { _id: 't1' }
    };

    mockMaintenance.findById
      .mockResolvedValueOnce(maintenance)
      .mockReturnValueOnce(createPopulateChain(updated, 3));

    const req = makeReq({
      params: { id: 'm3' },
      body: { status: 'in-progress' },
      user: { _id: 'h1', name: 'Host' }
    });
    const res = makeRes();

    await updateMaintenanceStatus(req, res);

    expect(maintenance.status).toBe('in-progress');
    expect(maintenance.startedAt).toBeInstanceOf(Date);
    expect(mockNotifyMaintenanceUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 't1',
        status: 'in-progress',
        maintenanceId: 'm3'
      })
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('UT-M04 host marks issue resolved with cost and notes', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const maintenance = {
      _id: 'm4',
      title: 'Door lock issue',
      status: 'in-progress',
      save
    };
    const updated = {
      _id: 'm4',
      title: 'Door lock issue',
      status: 'resolved',
      actualCost: 3000,
      resolutionNotes: 'Replaced lock',
      property: { _id: 'p1', title: 'Flat' },
      reportedBy: { _id: 't1' }
    };

    mockMaintenance.findById
      .mockResolvedValueOnce(maintenance)
      .mockReturnValueOnce(createPopulateChain(updated, 3));

    const req = makeReq({
      params: { id: 'm4' },
      body: {
        status: 'resolved',
        resolutionNotes: 'Replaced lock',
        actualCost: 3000
      },
      user: { _id: 'h1', name: 'Host' }
    });
    const res = makeRes();

    await updateMaintenanceStatus(req, res);

    expect(maintenance.status).toBe('resolved');
    expect(maintenance.resolvedAt).toBeInstanceOf(Date);
    expect(maintenance.actualCost).toBe(3000);
    expect(maintenance.resolutionNotes).toBe('Replaced lock');
    expect(mockNotifyMaintenanceResolved).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 't1',
        maintenanceId: 'm4'
      })
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });
});
