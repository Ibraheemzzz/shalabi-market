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
 * Protected route — returns user info + permissions
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'Guest') {
      return successResponse(res, {
        guest_id: user.guest_id,
        role: 'Guest',
        permissions: []
      }, 'Guest user');
    }

    const userInfo = await authService.verifyUser(user.user_id);

    // Load permissions for this role
    const prisma = require('../../config/prisma');
    const rolePerms = await prisma.rolePermission.findMany({
      where: { role: userInfo.role },
      include: { permission: { select: { code: true } } }
    });
    const permissions = rolePerms.map(rp => rp.permission.code);

    return successResponse(res, {
      user_id: userInfo.user_id,
      phone_number: userInfo.phone_number,
      name: userInfo.name,
      role: userInfo.role,
      permissions
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

/**
 * Check phone number (Step 1 of two-step login)
 * POST /api/auth/check-phone
 */
const checkPhone = async (req, res) => {
  try {
    const { phone_number } = req.body;

    const result = await authService.checkPhone(phone_number);

    return successResponse(res, result, 'Phone number found');
  } catch (error) {
    if (error.message === 'PHONE_NOT_FOUND') {
      return errorResponse(res, 'رقم الهاتف غير مسجّل', 404);
    }
    if (error.message === 'ACCOUNT_DEACTIVATED') {
      return errorResponse(res, 'الحساب معطّل. تواصل مع الدعم.', 403);
    }
    if (error.message === 'ACCOUNT_NOT_VERIFIED') {
      return errorResponse(res, 'الحساب غير مؤكد. تم إرسال رمز تحقق جديد.', 403, { needs_verification: true, phone_number: req.body.phone_number });
    }
    logger.error('Check phone error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to check phone number');
  }
};

/**
 * Forgot password — send OTP for reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { phone_number } = req.body;
    const result = await authService.forgotPassword(phone_number);
    return successResponse(res, null, result.message);
  } catch (error) {
    if (error.message === 'PHONE_NOT_FOUND') {
      return errorResponse(res, 'رقم الهاتف غير مسجّل', 404);
    }
    if (error.message === 'ACCOUNT_DEACTIVATED') {
      return errorResponse(res, 'الحساب معطّل. تواصل مع الدعم.', 403);
    }
    if (error.message === 'ACCOUNT_NOT_VERIFIED') {
      return errorResponse(res, 'الحساب غير مؤكد. يرجى تأكيد حسابك أولاً.', 403);
    }
    logger.error('Forgot password error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to process forgot password request');
  }
};

/**
 * Verify OTP code for password reset
 * POST /api/auth/verify-reset-otp
 */
const verifyResetOtp = async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body;
    await authService.verifyResetOtp(phone_number, otp_code);
    return successResponse(res, null, 'OTP is valid');
  } catch (error) {
    if (error.message === 'INVALID_OTP') {
      return errorResponse(res, 'رمز التحقق غير صحيح أو منتهي الصلاحية', 400);
    }
    logger.error('Verify reset OTP error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to verify OTP');
  }
};

/**
 * Reset password using OTP
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { phone_number, otp_code, new_password } = req.body;
    const result = await authService.resetPassword(phone_number, otp_code, new_password);
    return successResponse(res, null, result.message);
  } catch (error) {
    if (error.message === 'INVALID_OTP') {
      return errorResponse(res, 'رمز التحقق غير صحيح أو منتهي الصلاحية', 400);
    }
    logger.error('Reset password error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to reset password');
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  createGuest,
  getCurrentUser,
  checkPhone,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};