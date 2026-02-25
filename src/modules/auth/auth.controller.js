const authService = require('./auth.service');
const {
  successResponse,
  errorResponse,
  createdResponse,
  serverErrorResponse
} = require('../../utils/response');
const logger = require('../../config/logger');

/**
 * Auth Controller
 * Handles HTTP request and response for authentication endpoints
 */

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { phone_number, name, password } = req.body;

    const result = await authService.register({ phone_number, name, password });

    return successResponse(res, null, result.message, 201);
  } catch (error) {
    if (error.message === 'Phone number already registered' || error.message.includes('Phone number is registered but not verified')) {
      return errorResponse(res, error.message, 409);
    }
    logger.error('Register error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Registration failed');
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    const result = await authService.login(phone_number, password);

    return successResponse(res, {
      user: result.user,
      token: result.token
    }, 'Login successful');
  } catch (error) {
    if (error.message === 'Invalid phone number or password') {
      return errorResponse(res, error.message, 401);
    }
    if (error.message === 'Account is deactivated. Please contact support.' || error.message === 'Account is not verified. Please verify your phone number first.') {
      return errorResponse(res, error.message, 403);
    }
    logger.error('Login error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Login failed');
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 * Protected route
 */
const logout = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return errorResponse(res, 'Invalid session', 400);
    }

    await authService.logout(user_id);

    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Logout failed');
  }
};

/**
 * Create guest user
 * POST /api/auth/guest
 */
const createGuest = async (req, res) => {
  try {
    const { phone_number, name } = req.body;

    const result = await authService.createGuest({ phone_number, name });

    return createdResponse(res, {
      guest: result.guest,
      token: result.token
    }, 'Guest session created');
  } catch (error) {
    logger.error('Create guest error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to create guest session');
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 * Protected route
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'Guest') {
      return successResponse(res, {
        guest_id: user.guest_id,
        role: 'Guest'
      }, 'Guest user');
    }

    const userInfo = await authService.verifyUser(user.user_id);

    return successResponse(res, {
      user_id: userInfo.user_id,
      phone_number: userInfo.phone_number,
      name: userInfo.name,
      role: userInfo.role
    }, 'User info retrieved');
  } catch (error) {
    logger.error('Get current user error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to get user info');
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body;

    const result = await authService.verifyOtp(phone_number, otp_code);

    return successResponse(res, {
      user: result.user,
      token: result.token
    }, 'Phone number verified successfully');
  } catch (error) {
    if (error.message === 'User not found' || error.message === 'Account is already verified' || error.message === 'Invalid or expired OTP code') {
      return errorResponse(res, error.message, 400);
    }
    logger.error('Verify OTP error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'OTP verification failed');
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
const resendOtp = async (req, res) => {
  try {
    const { phone_number } = req.body;

    const result = await authService.resendOtp(phone_number);

    return successResponse(res, null, result.message);
  } catch (error) {
    if (error.message === 'User not found' || error.message === 'Account is already verified') {
      return errorResponse(res, error.message, 400);
    }
    logger.error('Resend OTP error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to resend OTP');
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  createGuest,
  getCurrentUser
};