import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  deleteAccount
} from '../controller/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes - require authentication
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

// Admin routes
router.put('/verify-email/:userId', authenticate, isAdmin, verifyEmail);

export default router;
