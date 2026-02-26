const usersService = require('./users.service');
const ordersService = require('../orders/orders.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse
} = require('../../utils/response');
const logger = require('../../config/logger');

/**
 * Users Controller
 * Handles HTTP request and response for user endpoints
 */

/**
 * Get current user profile
 * GET /api/users/profile
 * Protected route
 */
const getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const profile = await usersService.getProfile(user_id);
    const stats = await usersService.getUserStats(user_id);

    return successResponse(res, {
      ...profile,
      stats
    }, 'Profile retrieved successfully');
  } catch (error) {
    if (error.message === 'User not found') {
      return notFoundResponse(res, 'User');
    }
    logger.error('Get profile error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to get profile');
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 * Protected route
 */
const updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { name, password, current_password } = req.body;

    // Validate input
    if (!name && !password) {
      return errorResponse(res, 'At least one field (name or password) must be provided', 400);
    }

    // If updating password, current_password is required
    if (password && !current_password) {
      return errorResponse(res, 'Current password is required to set a new password', 400);
    }

    // Validate password length
    if (password && password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    const profile = await usersService.updateProfile(user_id, {
      name,
      password,
      current_password
    });

    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    if (error.message === 'User not found') {
      return notFoundResponse(res, 'User');
    }
    if (error.message === 'Current password is incorrect') {
      return errorResponse(res, error.message, 400);
    }
    if (error.message === 'At least one field (name or password) must be provided') {
      return errorResponse(res, error.message, 400);
    }
    logger.error('Update profile error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to update profile');
  }
};

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const result = await usersService.getAllUsers({
      search,
      page: page || 1,
      limit: limit || 20
    });

    return successResponse(res, result, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Get all users error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to get users');
  }
};

/**
 * Toggle user status (admin only)
 * PUT /api/admin/users/:id/status
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return errorResponse(res, 'Invalid user ID', 400);
    }

    const user = await usersService.toggleUserStatus(parseInt(id));

    return successResponse(res, user, `User ${user.is_active ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    if (error.message === 'User not found') {
      return notFoundResponse(res, 'User');
    }
    if (error.message === 'Cannot deactivate admin users') {
      return errorResponse(res, error.message, 403);
    }
    logger.error('Toggle user status error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to toggle user status');
  }
};

/**
 * Get user by ID (admin only)
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return errorResponse(res, 'Invalid user ID', 400);
    }

    const user = await usersService.getUserById(parseInt(id));
    const stats = await usersService.getUserStats(parseInt(id));

    return successResponse(res, {
      ...user,
      stats
    }, 'User retrieved successfully');
  } catch (error) {
    if (error.message === 'User not found') {
      return notFoundResponse(res, 'User');
    }
    logger.error('Get user by ID error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to get user');
  }
};

/**
 * Request phone number change
 * POST /api/users/change-phone
 * Protected route
 */
const requestPhoneChange = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { new_phone_number } = req.body;

    const result = await usersService.requestPhoneChange(user_id, new_phone_number);
    return successResponse(res, null, result.message);
  } catch (error) {
    if (error.message === 'PHONE_ALREADY_TAKEN') {
      return errorResponse(res, 'رقم الهاتف مسجّل لحساب آخر', 409);
    }
    if (error.message === 'SAME_PHONE') {
      return errorResponse(res, 'الرقم الجديد مطابق للرقم الحالي', 400);
    }
    if (error.message === 'User not found') {
      return notFoundResponse(res, 'User');
    }
    logger.error('Request phone change error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to request phone change');
  }
};

/**
 * Verify phone number change with OTP
 * POST /api/users/verify-phone-change
 * Protected route
 */
const verifyPhoneChange = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { new_phone_number, otp_code } = req.body;

    const result = await usersService.verifyPhoneChange(user_id, new_phone_number, otp_code);
    return successResponse(res, result, 'تم تغيير رقم الهاتف بنجاح');
  } catch (error) {
    if (error.message === 'INVALID_OTP') {
      return errorResponse(res, 'رمز التحقق غير صحيح أو منتهي الصلاحية', 400);
    }
    logger.error('Verify phone change error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to verify phone change');
  }
};

/**
 * Change user role (admin only)
 * PUT /api/admin/users/:id/role
 */
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return errorResponse(res, 'Invalid user ID', 400);
    }

    if (!role) {
      return errorResponse(res, 'Role is required', 400);
    }

    const user = await usersService.changeUserRole(parseInt(id), role);

    return successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    if (error.message === 'User not found') {
      return notFoundResponse(res, 'User');
    }
    if (error.message === 'Invalid role' || error.message === 'Cannot change main Admin role') {
      return errorResponse(res, error.message, 400);
    }
    logger.error('Change user role error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to change user role');
  }
};


/**
 * Get all orders for a specific user (admin only)
 * GET /api/admin/users/:id/orders
 */
const getUserOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    if (!id || isNaN(parseInt(id))) {
      return errorResponse(res, 'Invalid user ID', 400);
    }

    const result = await ordersService.getUserOrders(parseInt(id), {
      page: page || 1,
      limit: limit || 20
    });

    return successResponse(res, result, 'User orders retrieved successfully');
  } catch (error) {
    logger.error('Get user orders error:', { error: error.message, stack: error.stack });
    return serverErrorResponse(res, 'Failed to get user orders');
  }
};


module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  toggleUserStatus,
  getUserById,
  requestPhoneChange,
  verifyPhoneChange,
  changeUserRole,
  getUserOrders
};
