const { body } = require('express-validator');

/**
 * Auth Validation Rules
 */

/**
 * Register validation rules
 */
const register = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^05\d{8}$/)
    .withMessage('Phone number must be exactly 10 digits and start with 05'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

/**
 * Login validation rules
 */
const login = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Guest validation rules
 * phone_number is optional — guests may provide it for contact purposes
 */
const guest = [
  body('phone_number')
    .optional()
    .matches(/^05\d{8}$/)
    .withMessage('Phone number must be exactly 10 digits and start with 05')
];

/**
 * Verify OTP validation rules
 */
const verifyOtp = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required'),

  body('otp_code')
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 digits')
];

/**
 * Resend OTP validation rules
 */
const resendOtp = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
];

/**
 * Check phone validation rules (Step 1 of login)
 */
const checkPhone = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^05\d{8}$/)
    .withMessage('Phone number must be exactly 10 digits and start with 05')
];

/**
 * Forgot password validation rules
 */
const forgotPassword = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^05\d{8}$/)
    .withMessage('Phone number must be exactly 10 digits and start with 05')
];

/**
 * Reset password validation rules
 */
const resetPassword = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required'),

  body('otp_code')
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 digits'),

  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

module.exports = {
  register,
  login,
  guest,
  verifyOtp,
  resendOtp,
  checkPhone,
  forgotPassword,
  resetPassword
};
