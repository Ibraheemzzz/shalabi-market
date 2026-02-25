const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const authValidators = require('./auth.validators');
const { loginLimiter, registerLimiter, guestLimiter } = require('../../middlewares/rateLimit.middleware');

/**
 * @route   POST /api/auth/register
 * @access  Public  |  Rate-limited (env-based): 10/hour in production, 20/hour in development
 */
router.post('/register', registerLimiter, authValidators.register, validate, authController.register);

/**
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
router.post('/verify-otp', authValidators.verifyOtp, validate, authController.verifyOtp);

/**
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
router.post('/resend-otp', authValidators.resendOtp, validate, authController.resendOtp);

/**
 * @route   POST /api/auth/login
 * @access  Public  |  Rate-limited: prod 10/hr, dev 20/hr  |  counts failures only
 */
router.post('/login', loginLimiter, authValidators.login, validate, authController.login);

/**
 * @route   POST /api/auth/logout
 * @access  Private
 */
router.post('/logout', authenticate, requireUser, authController.logout);

/**
 * @route   POST /api/auth/guest
 * @access  Public  |  Rate-limited: 5 sessions / 1 hr
 */
router.post('/guest', guestLimiter, authValidators.guest, validate, authController.createGuest);

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
