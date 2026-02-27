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
  selectRole,
  googleAuth,
  googleAuthCallback,
  facebookAuth,
  facebookAuthCallback
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  registerRules,
  loginRules,
  verifyEmailRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateProfileRules,
  updatePasswordRules
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/verify-email', verifyEmailRules, verifyEmail);
router.post('/verify-phone', verifyPhone);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPasswordRules, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, resetPassword);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookAuthCallback);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfileRules, updateProfile);
router.put('/update-password', protect, updatePasswordRules, updatePassword);
router.put('/select-role', protect, selectRole);
router.post('/logout', protect, logout);

export default router;
