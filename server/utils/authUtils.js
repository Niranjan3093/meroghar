import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode in token
 * @param {String} expiresIn - Token expiration time (default: 7d)
 * @returns {String} JWT token
 */
export const generateAccessToken = (payload, expiresIn = '7d') => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn }
  );
};

/**
 * Generate refresh token
 * @param {String} userId - User ID
 * @param {String} expiresIn - Token expiration time (default: 30d)
 * @returns {String} Refresh token
 */
export const generateRefreshToken = (userId, expiresIn = '30d') => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {Boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken 
    ? (process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key')
    : (process.env.JWT_SECRET || 'your-secret-key');
  
  return jwt.verify(token, secret);
};

/**
 * Remove sensitive fields from user object
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
export const sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : { ...user };
  
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.verificationTokenExpires;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.refreshToken;
  delete userObject.__v;
  
  return userObject;
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength;
  
  return {
    isValid,
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength
 * @param {String} password - Password to evaluate
 * @returns {String} Strength level: 'weak', 'medium', 'strong'
 */
const calculatePasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

/**
 * Create standardized success response
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @returns {Object} Formatted response
 */
export const successResponse = (message, data = {}) => {
  return {
    success: true,
    message,
    ...data
  };
};

/**
 * Create standardized error response
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @returns {Object} Formatted error response
 */
export const errorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode
  };
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

/**
 * Check if user has required role
 * @param {String} userRole - User's role
 * @param {Array<String>} allowedRoles - Array of allowed roles
 * @returns {Boolean} Has required role
 */
export const hasRole = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

/**
 * Generate random code for verification
 * @param {Number} length - Code length (default: 6)
 * @returns {String} Random numeric code
 */
export const generateVerificationCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};
