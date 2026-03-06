const authService = require('./auth.service');
const prisma = require('../../config/prisma');
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
const withController = ({ context, fallbackMessage, mapError }, handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    const mappedError = mapError ? mapError(error, req) : null;

    if (mappedError) {
      return errorResponse(
        res,
        mappedError.message,
        mappedError.status,
        mappedError.data ?? null
      );
    }

    logger.error(`${context} error:`, { error: error.message, stack: error.stack });
    return serverErrorResponse(res, fallbackMessage);
  }
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = withController(
  {
    context: 'Register',
    fallbackMessage: 'Registration failed',
    mapError: (error) => {
      if (error.message === 'Phone number already registered' || error.message.includes('Phone number is registered but not verified')) {
        return { status: 409, message: error.message };
      }
      return null;
    }
  },
  async (req, res) => {
    const { phone_number, name, password } = req.body;
    const result = await authService.register({ phone_number, name, password });

    return successResponse(res, null, result.message, 201);
  }
);

/**
 * Login user
 * POST /api/auth/login
 */
const login = withController(
  {
    context: 'Login',
    fallbackMessage: 'Login failed',
    mapError: (error) => {
      if (error.message === 'Invalid phone number or password') {
        return { status: 401, message: error.message };
      }

      if (error.message === 'Account is deactivated. Please contact support.' || error.message === 'Account is not verified. Please verify your phone number first.') {
        return { status: 403, message: error.message };
      }

      return null;
    }
  },
  async (req, res) => {
    const { phone_number, password } = req.body;
    const result = await authService.login(phone_number, password);

    return successResponse(res, {
      user: result.user,
      token: result.token
    }, 'Login successful');
  }
);

/**
 * Logout user
 * POST /api/auth/logout
 * Protected route
 */
const logout = withController(
  {
    context: 'Logout',
    fallbackMessage: 'Logout failed'
  },
  async (req, res) => {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return errorResponse(res, 'Invalid session', 400);
    }

    await authService.logout(user_id);

    return successResponse(res, null, 'Logged out successfully');
  }
);

/**
 * Create guest user
 * POST /api/auth/guest
 */
const createGuest = withController(
  {
    context: 'Create guest',
    fallbackMessage: 'Failed to create guest session'
  },
  async (req, res) => {
    const { phone_number, name } = req.body;
    const result = await authService.createGuest({ phone_number, name });

    return createdResponse(res, {
      guest: result.guest,
      token: result.token
    }, 'Guest session created');
  }
);

/**
 * Get current user info
 * GET /api/auth/me
 * Protected route — returns user info + permissions
 */
const getCurrentUser = withController(
  {
    context: 'Get current user',
    fallbackMessage: 'Failed to get user info'
  },
  async (req, res) => {
    const user = req.user;

    if (user.role === 'Guest') {
      return successResponse(res, {
        guest_id: user.guest_id,
        role: 'Guest',
        permissions: []
      }, 'Guest user');
    }

    const userInfo = await authService.verifyUser(user.user_id);

    const rolePerms = await prisma.rolePermission.findMany({
      where: { role: userInfo.role },
      include: { permission: { select: { code: true } } }
    });
    const permissions = rolePerms.map((rp) => rp.permission.code);

    return successResponse(res, {
      user_id: userInfo.user_id,
      phone_number: userInfo.phone_number,
      name: userInfo.name,
      role: userInfo.role,
      permissions
    }, 'User info retrieved');
  }
);

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
const verifyOtp = withController(
  {
    context: 'Verify OTP',
    fallbackMessage: 'OTP verification failed',
    mapError: (error) => {
      if (error.message === 'User not found' || error.message === 'Account is already verified' || error.message === 'Invalid or expired OTP code') {
        return { status: 400, message: error.message };
      }
      return null;
    }
  },
  async (req, res) => {
    const { phone_number, otp_code } = req.body;
    const result = await authService.verifyOtp(phone_number, otp_code);

    return successResponse(res, {
      user: result.user,
      token: result.token
    }, 'Phone number verified successfully');
  }
);

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
const resendOtp = withController(
  {
    context: 'Resend OTP',
    fallbackMessage: 'Failed to resend OTP',
    mapError: (error) => {
      if (error.message === 'User not found' || error.message === 'Account is already verified') {
        return { status: 400, message: error.message };
      }
      return null;
    }
  },
  async (req, res) => {
    const { phone_number } = req.body;
    const result = await authService.resendOtp(phone_number);

    return successResponse(res, null, result.message);
  }
);

/**
 * Check phone number (Step 1 of two-step login)
 * POST /api/auth/check-phone
 */
const checkPhone = withController(
  {
    context: 'Check phone',
    fallbackMessage: 'Failed to check phone number',
    mapError: (error, req) => {
      if (error.message === 'PHONE_NOT_FOUND') {
        return { status: 404, message: 'رقم الهاتف غير مسجّل' };
      }

      if (error.message === 'ACCOUNT_DEACTIVATED') {
        return { status: 403, message: 'الحساب معطّل. تواصل مع الدعم.' };
      }

      if (error.message === 'ACCOUNT_NOT_VERIFIED') {
        return {
          status: 403,
          message: 'الحساب غير مؤكد. تم إرسال رمز تحقق جديد.',
          data: { needs_verification: true, phone_number: req.body.phone_number }
        };
      }

      return null;
    }
  },
  async (req, res) => {
    const { phone_number } = req.body;
    const result = await authService.checkPhone(phone_number);

    return successResponse(res, result, 'Phone number found');
  }
);

/**
 * Forgot password — send OTP for reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = withController(
  {
    context: 'Forgot password',
    fallbackMessage: 'Failed to process forgot password request',
    mapError: (error) => {
      if (error.message === 'PHONE_NOT_FOUND') {
        return { status: 404, message: 'رقم الهاتف غير مسجّل' };
      }

      if (error.message === 'ACCOUNT_DEACTIVATED') {
        return { status: 403, message: 'الحساب معطّل. تواصل مع الدعم.' };
      }

      if (error.message === 'ACCOUNT_NOT_VERIFIED') {
        return { status: 403, message: 'الحساب غير مؤكد. يرجى تأكيد حسابك أولاً.' };
      }

      return null;
    }
  },
  async (req, res) => {
    const { phone_number } = req.body;
    const result = await authService.forgotPassword(phone_number);

    return successResponse(res, null, result.message);
  }
);

/**
 * Verify OTP code for password reset
 * POST /api/auth/verify-reset-otp
 */
const verifyResetOtp = withController(
  {
    context: 'Verify reset OTP',
    fallbackMessage: 'Failed to verify OTP',
    mapError: (error) => {
      if (error.message === 'INVALID_OTP') {
        return { status: 400, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' };
      }
      return null;
    }
  },
  async (req, res) => {
    const { phone_number, otp_code } = req.body;
    await authService.verifyResetOtp(phone_number, otp_code);

    return successResponse(res, null, 'OTP is valid');
  }
);

/**
 * Reset password using OTP
 * POST /api/auth/reset-password
 */
const resetPassword = withController(
  {
    context: 'Reset password',
    fallbackMessage: 'Failed to reset password',
    mapError: (error) => {
      if (error.message === 'INVALID_OTP') {
        return { status: 400, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' };
      }
      return null;
    }
  },
  async (req, res) => {
    const { phone_number, otp_code, new_password } = req.body;
    const result = await authService.resetPassword(phone_number, otp_code, new_password);

    return successResponse(res, null, result.message);
  }
);

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
