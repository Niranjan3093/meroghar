import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import {
  createVisitSitting,
  getAvailableDates,
  getHostVisitRequests,
  getTenantVisitRequests,
  approveVisitSitting,
  rejectVisitSitting,
  cancelVisitSitting,
  getVisitSitting
} from '../controllers/visitSittingController.js';

// Create a new visit sitting request
router.post('/', protect, createVisitSitting);

// Get available dates for a property
router.get('/property/:propertyId/available-dates', getAvailableDates);

// Get visit sitting by ID
router.get('/:id', protect, getVisitSitting);

// Get all visit requests for the logged-in host
router.get('/host/requests/list', protect, getHostVisitRequests);

// Get all visit requests for the logged-in tenant
router.get('/tenant/requests/list', protect, getTenantVisitRequests);

// Approve a visit sitting request
router.put('/:id/approve', protect, approveVisitSitting);

// Reject a visit sitting request
router.put('/:id/reject', protect, rejectVisitSitting);

// Cancel a visit sitting request
router.put('/:id/cancel', protect, cancelVisitSitting);

export default router;
