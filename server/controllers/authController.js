import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import passport from 'passport';
import { notifyNewUserRegistration } from '../utils/notifications.js';
import { cloudinary } from '../middleware/uploadMiddleware.js';
import { getAppSettings } from '../utils/appSettings.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const appSettings = await getAppSettings();
    const platformName = appSettings.platformName || 'MeroGhar';

    let { name, email, phone, password, role } = req.body;

    // Normalize and validate inputs
    if (!email || typeof email !== 'string') {
      res.status(400);
      throw new Error('Valid email is required');
    }
    
    // Trim and lowercase email
    email = email.trim().toLowerCase();
    
    // Trim name and normalize phone
    if (name) {
      name = name.trim();
    }
    if (phone && typeof phone === 'string') {
      phone = phone.trim();
      // Set phone to null if it's empty after trimming
      phone = phone === '' ? null : phone;
    } else {
      phone = null;
    }

    // Check if user exists - only check non-null phone
    const query = { email };
    if (phone) {
      query.$or = [{ email }, { phone }];
    }
    
    const userExists = await User.findOne(query);
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'tenant'
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    let emailSent = false;

    // Send verification email (don't fail registration if email fails)
    if (email) {
      try {
        emailSent = await sendEmail({
          to: email,
          subject: `Verify Your Email - ${platformName}`,
          text: `Your verification code is: ${verificationToken}`,
          html: `<p>Your verification code is: <strong>${verificationToken}</strong></p><p>This code will expire in 10 minutes.</p>`
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }

    // Notify admins about new user registration
    try {
      const io = req.app.get('io');
      await notifyNewUserRegistration(io, {
        userId: user._id,
        userName: user.name,
        userEmail: user.email
      });
    } catch (notifError) {
      console.error('Failed to notify admins:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Registration successful. Please verify your email.'
        : 'Registration successful. Please request a new verification code.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationSent: emailSent
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const settings = await getAppSettings();
    const platformName = settings.platformName || 'MeroGhar';
    const maxLoginAttempts = settings.maxLoginAttempts || 5;
    const lockDurationMs = 30 * 60 * 1000;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      res.status(429);
      throw new Error('Account temporarily locked due to too many failed login attempts. Please try again later.');
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= maxLoginAttempts) {
        user.lockUntil = new Date(Date.now() + lockDurationMs);

        if (settings.adminEmailNotifications?.maxLoginAttemptsExceeded) {
          const shouldSendAlert = !user.loginAlertSentAt || (Date.now() - new Date(user.loginAlertSentAt).getTime()) > lockDurationMs;

          if (shouldSendAlert) {
            const admins = await User.find({ role: 'admin', isActive: true }).select('email');
            const recipients = [
              ...new Set([
                ...admins.map((admin) => admin.email).filter(Boolean),
                settings.adminNotificationEmail
              ].filter(Boolean))
            ];

            for (const recipient of recipients) {
              await sendEmail({
                to: recipient,
                subject: 'Max Login Attempts Exceeded',
                text: `User ${user.email} exceeded ${maxLoginAttempts} failed login attempts and has been temporarily locked.`,
                html: `<p>User <strong>${user.email}</strong> exceeded <strong>${maxLoginAttempts}</strong> failed login attempts and has been temporarily locked.</p>`
              });
            }

            user.loginAlertSentAt = new Date();
          }
        }
      }

      await user.save();

      res.status(401);
      throw new Error('Invalid credentials');
    }

    if (settings.maintenanceMode && user.role !== 'admin') {
      res.status(403);
      throw new Error('Only admin can login during maintenance mode');
    }

    if (settings.requireEmailVerification && !user.isVerified) {
      const verificationToken = user.generateVerificationToken();
      await user.save();

      try {
        await sendEmail({
          to: user.email,
          subject: `Verify Your Email - ${platformName}`,
          text: `Your verification code is: ${verificationToken}`,
          html: `<p>Your verification code is: <strong>${verificationToken}</strong></p><p>This code will expire in 10 minutes.</p>`
        });
      } catch (emailError) {
        console.error('Failed to resend verification code during login:', emailError.message);
      }

      res.status(401);
      const error = new Error('Please verify your account first');
      error.code = 'EMAIL_NOT_VERIFIED';
      error.email = user.email;
      error.verificationSent = true;
      throw error;
    }

    if (user.isBanned) {
      res.status(403);
      throw new Error(`Account banned: ${user.banReason}`);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = user.generateToken();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, token } = req.body;

    const user = await User.findOne({
      email,
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    const authToken = user.generateToken();

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: authToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res, next) => {
  try {
    const appSettings = await getAppSettings();
    const platformName = appSettings.platformName || 'MeroGhar';

    const normalizedEmail = req.body.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('Account already verified');
    }

    const verificationToken = user.generateVerificationToken();
    await user.save();

    if (normalizedEmail) {
      await sendEmail({
        to: normalizedEmail,
        subject: `Verify Your Email - ${platformName}`,
        text: `Your verification code is: ${verificationToken}`,
        html: `<p>Your verification code is: <strong>${verificationToken}</strong></p>`
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const appSettings = await getAppSettings();
    const platformName = appSettings.platformName || 'MeroGhar';

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const resetToken = user.generateVerificationToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    await sendEmail({
      to: email,
      subject: `Password Reset - ${platformName}`,
      text: `Your password reset code is: ${resetToken}`,
      html: `<p>Your password reset code is: <strong>${resetToken}</strong></p><p>This code will expire in 30 minutes.</p>`
    });

    res.json({
      success: true,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Select role for new OAuth users
// @route   PUT /api/auth/select-role
// @access  Private
export const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Only allow tenant or host roles
    if (!['tenant', 'host'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role. Please select tenant or host.');
    }

    const user = await User.findById(req.user.id);

    // Only allow role selection if user still has default tenant role
    // This prevents users from switching roles arbitrarily
    if (user.role !== 'tenant') {
      res.status(400);
      throw new Error('Role has already been selected.');
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      bio: req.body.bio,
      dateOfBirth: req.body.dateOfBirth,
      address: req.body.address,
      avatar: req.body.avatar,
      occupation: req.body.occupation,
      monthlyIncome: req.body.monthlyIncome
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // OAuth users (Google/Facebook) have no local password
    if (!user.password) {
      res.status(400);
      throw new Error('Password change is not available for social login accounts');
    }

    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

export const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
      }

      const settings = await getAppSettings();
      if (settings.maintenanceMode && user.role !== 'admin') {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?admin=true&error=${encodeURIComponent('Only admin can login during maintenance mode')}`);
      }
      
      const token = user.generateToken();
      const isNewUser = user._isNewOAuthUser === true;
      const adminQuery = settings.maintenanceMode ? '&admin=true' : '';
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&isNewUser=${isNewUser}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }))}${adminQuery}`);
    } catch (callbackError) {
      return next(callbackError);
    }
  })(req, res, next);
};

// @desc    Upload/update avatar
// @route   PUT /api/auth/upload-avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image');
    }

    const user = await User.findById(req.user.id);

    // Delete old avatar from Cloudinary if it exists and is not placeholder
    if (user.avatar && !user.avatar.includes('placeholder') && user.avatar.includes('cloudinary')) {
      try {
        const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({
      success: true,
      data: { avatar: user.avatar }
    });
  } catch (error) {
    next(error);
  }
};

// Facebook OAuth
export const facebookAuth = passport.authenticate('facebook');

export const facebookAuthCallback = (req, res, next) => {
  passport.authenticate('facebook', { session: false }, async (err, user, info) => {
    try {
      console.error('Facebook OAuth Error:', err);
      console.error('Facebook OAuth Info:', info);
      if (err || !user) {
        const errorMsg = err?.message || info?.message || 'auth_failed';
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(errorMsg)}`);
      }

      const settings = await getAppSettings();
      if (settings.maintenanceMode && user.role !== 'admin') {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?admin=true&error=${encodeURIComponent('Only admin can login during maintenance mode')}`);
      }
      
      const token = user.generateToken();
      const isNewUser = user._isNewOAuthUser === true;
      const adminQuery = settings.maintenanceMode ? '&admin=true' : '';
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&isNewUser=${isNewUser}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }))}${adminQuery}`);
    } catch (callbackError) {
      return next(callbackError);
    }
  })(req, res, next);
};
