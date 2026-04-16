import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  mockMaintenance,
  getRouteHandler,
  createPopulateSortChain,
  makeReq,
  makeRes,
  resetMaintenanceRouteMocks
} from '../../tests/maintenanceRoutesSetup.js';

describe('maintenanceRoutes getMaintenanceHistory', () => {
  const getMaintenanceHistory = getRouteHandler('get', '/property/:propertyId');

  beforeEach(() => {
    resetMaintenanceRouteMocks();
  });

  it('UT-M05 admin gets property maintenance history', async () => {
    const history = [
      { _id: 'm5a', title: 'Pipe leak', property: 'p1' },
      { _id: 'm5b', title: 'Electric short', property: 'p1' }
    ];

    mockMaintenance.find.mockReturnValue(createPopulateSortChain(history));

    const req = makeReq({
      params: { propertyId: 'p1' },
      user: { _id: 'a1', role: 'admin' }
    });
    const res = makeRes();

    await getMaintenanceHistory(req, res);

    expect(mockMaintenance.find).toHaveBeenCalledWith({ property: 'p1' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: history });
  });
});
