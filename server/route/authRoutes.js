import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  deleteAccount,
  refreshToken,
  logout
} from '../controller/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, isAdmin, isVerified } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes - require authentication
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);
router.delete('/account', authenticate, deleteAccount);

// Example protected routes that require verification
// router.get('/verified-only', authenticate, isVerified, (req, res) => {
//   res.json({ success: true, message: 'You have access to this verified route' });
// });

// Admin routes - require authentication and admin role
// router.get('/admin/users', authenticate, isAdmin, getAllUsers);

export default router;
