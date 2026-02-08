import express from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
  verifyPhone,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  updatePassword,
  googleAuth,
  googleAuthCallback,
  facebookAuth,
  facebookAuthCallback
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/verify-phone', verifyPhone);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookAuthCallback);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.post('/logout', protect, logout);

export default router;
