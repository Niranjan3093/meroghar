import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  getAllProperties,
  getPropertyDetails,
  getAllLeases,
  getAnalyticsReport
} from '../controllers/adminController.js';

// All routes are protected and admin-only
router.use(protect, authorize('admin'));

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Property management
router.get('/properties', getAllProperties);
router.get('/properties/pending', getPendingProperties);
router.get('/properties/:id', getPropertyDetails);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);

// Lease management
router.get('/leases', getAllLeases);

// Analytics
router.get('/analytics', getAnalyticsReport);

export default router;

