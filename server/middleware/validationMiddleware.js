import { body, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors if any.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    const firstError = errors.array()[0].msg;
    throw new Error(firstError);
  }
  next();
};

// ─── Auth Validation Rules ────────────────────────────────────────────────────

export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email must be less than 100 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+977)?[0-9]{10}$/).withMessage('Enter a valid Nepali phone number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),

  body('role')
    .optional()
    .isIn(['tenant', 'host']).withMessage('Role must be either tenant or host'),

  validate,
];

export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

export const verifyEmailRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('token')
    .trim()
    .notEmpty().withMessage('Verification token is required')
    .isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
    .isNumeric().withMessage('Token must contain only digits'),

  validate,
];

export const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  validate,
];

export const resetPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),

  validate,
];

export const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+977)?[0-9]{10}$/).withMessage('Enter a valid Nepali phone number'),

  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),

  validate,
];

export const updatePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters'),

  validate,
];
