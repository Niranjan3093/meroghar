import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['tenant', 'host', 'admin'], 
    default: 'tenant' 
  },
  verified: {
    type: Boolean, 
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  refreshToken: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to generate email verification token
userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Method to check if verification token is valid
userSchema.methods.isVerificationTokenValid = function(token) {
  if (!this.verificationToken || !this.verificationTokenExpires) {
    return false;
  }
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return hashedToken === this.verificationToken && 
         this.verificationTokenExpires > Date.now();
};

// Method to check if password reset token is valid
userSchema.methods.isPasswordResetTokenValid = function(token) {
  if (!this.passwordResetToken || !this.passwordResetExpires) {
    return false;
  }
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return hashedToken === this.passwordResetToken && 
         this.passwordResetExpires > Date.now();
};

export default mongoose.model('User', userSchema);