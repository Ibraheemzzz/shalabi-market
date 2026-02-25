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
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),

  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
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
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
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

module.exports = {
  register,
  login,
  guest,
  verifyOtp,
  resendOtp
};
