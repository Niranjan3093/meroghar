import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/sms.js';
import passport from 'passport';
import { notifyNewUserRegistration } from '../utils/notifications.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
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
    let smsSent = false;

    // Send verification email (don't fail registration if email fails)
    if (email) {
      try {
        emailSent = await sendEmail({
          to: email,
          subject: 'Verify Your Email - MeroGhar',
          text: `Your verification code is: ${verificationToken}`,
          html: `<p>Your verification code is: <strong>${verificationToken}</strong></p><p>This code will expire in 10 minutes.</p>`
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }

    // Send verification SMS (don't fail registration if SMS fails)
    if (phone) {
      try {
        await sendSMS(phone, `Your MeroGhar verification code is: ${verificationToken}`);
        smsSent = true;
      } catch (smsError) {
        console.error('SMS sending failed:', smsError.message);
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
      message: emailSent || smsSent 
        ? 'Registration successful. Please verify your email/phone.'
        : 'Registration successful. Please request a new verification code.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verificationSent: emailSent || smsSent
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
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your account first');
    }

    if (user.isBanned) {
      res.status(403);
      throw new Error(`Account banned: ${user.banReason}`);
    }

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

// @desc    Verify phone
// @route   POST /api/auth/verify-phone
// @access  Public
export const verifyPhone = async (req, res, next) => {
  try {
    const { phone, token } = req.body;

    const user = await User.findOne({
      phone,
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification token');
    }

    user.phoneVerified = true;
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    const authToken = user.generateToken();

    res.json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
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
    const { email, phone } = req.body;

    const user = await User.findOne({ $or: [{ email }, { phone }] });

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

    if (email) {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - MeroGhar',
        text: `Your verification code is: ${verificationToken}`,
        html: `<p>Your verification code is: <strong>${verificationToken}</strong></p>`
      });
    }

    if (phone) {
      await sendSMS(phone, `Your MeroGhar verification code is: ${verificationToken}`);
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
      subject: 'Password Reset - MeroGhar',
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
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
    
    const token = user.generateToken();
    const isNewUser = user._isNewOAuthUser === true;
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&isNewUser=${isNewUser}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }))}`);
  })(req, res, next);
};

// Facebook OAuth
export const facebookAuth = passport.authenticate('facebook');

export const facebookAuthCallback = (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user, info) => {
    console.error('Facebook OAuth Error:', err);
    console.error('Facebook OAuth Info:', info);
    if (err || !user) {
      const errorMsg = err?.message || info?.message || 'auth_failed';
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(errorMsg)}`);
    }
    
    const token = user.generateToken();
    const isNewUser = user._isNewOAuthUser === true;
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback?token=${token}&isNewUser=${isNewUser}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }))}`);
  })(req, res, next);
};
