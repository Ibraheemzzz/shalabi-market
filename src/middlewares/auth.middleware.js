const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/response');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user/guest info to request
 * 
 * Token payload for users: { user_id, role }
 * Token payload for guests: { guest_id, role: "Guest" }
 */

/**
 * Verify JWT token middleware
 * Required for all protected routes
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Authorization token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return unauthorizedResponse(res, 'Authorization token is required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user/guest info to request
    if (decoded.guest_id) {
      // Guest user — no DB check needed, guests are stateless
      req.user = {
        id: decoded.guest_id,
        guest_id: decoded.guest_id,
        role: 'Guest'
      };
      return next();
    }

    // Registered user — verify account is still active in DB
    const dbUser = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { user_id: true, role: true, is_active: true }
    });

    if (!dbUser) {
      return unauthorizedResponse(res, 'Account not found');
    }

    if (!dbUser.is_active) {
      return unauthorizedResponse(res, 'Account is deactivated. Please contact support.');
    }

    req.user = {
      id: dbUser.user_id,
      user_id: dbUser.user_id,
      role: dbUser.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Invalid token');
    }
    return unauthorizedResponse(res, 'Authentication failed');
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.guest_id) {
      req.user = {
        id: decoded.guest_id,
        guest_id: decoded.guest_id,
        role: 'Guest'
      };
    } else {
      // Registered user — verify account is still active in DB
      const dbUser = await prisma.user.findUnique({
        where: { user_id: decoded.user_id },
        select: { user_id: true, role: true, is_active: true }
      });

      if (!dbUser || !dbUser.is_active) {
        req.user = null;
        return next();
      }

      req.user = {
        id: dbUser.user_id,
        user_id: dbUser.user_id,
        role: dbUser.role
      };
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Admin role check middleware
 * Must be used after authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  if (req.user.role !== 'SuperAdmin') {
    return forbiddenResponse(res, 'SuperAdmin access required');
  }

  next();
};

/**
 * Customer role check middleware
 * Must be used after authenticate middleware
 * Allows both Customer and Admin roles
 */
const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  if (req.user.role === 'Guest') {
    return forbiddenResponse(res, 'Registered user account required');
  }

  next();
};

/**
 * Check if user is authenticated (not a guest)
 * Must be used after authenticate middleware
 */
const requireUser = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  if (req.user.role === 'Guest') {
    return forbiddenResponse(res, 'Please login to access this feature');
  }

  next();
};

/**
 * Guest or User authentication
 * Allows both guests and registered users
 */
const allowGuestOrUser = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }
  next();
};

/**
 * Role-based authorization
 * @param {Array} roles - Array of allowed roles
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    next();
  };
};

// ─── Permission-based authorization (RBAC) ────────────────────────────────────

// In-memory cache: { role: { permissions: [...], cachedAt: timestamp } }
const permissionCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load permissions for a role (with caching)
 */
const getPermissionsForRole = async (role) => {
  const cached = permissionCache[role];
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.permissions;
  }

  const rolePerms = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: { select: { code: true } } }
  });

  const permissions = rolePerms.map(rp => rp.permission.code);
  permissionCache[role] = { permissions, cachedAt: Date.now() };
  return permissions;
};

/**
 * Permission-based authorization middleware
 * Checks if user's role has the required permission(s)
 * @param  {...string} requiredPermissions - One or more permission codes (user needs at least one)
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required');
    }

    if (req.user.role === 'Guest') {
      return forbiddenResponse(res, 'Registered user account required');
    }

    try {
      const userPermissions = await getPermissionsForRole(req.user.role);

      // User needs at least ONE of the required permissions
      const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        return forbiddenResponse(res, 'ليس لديك صلاحية للقيام بهذا الإجراء');
      }

      // Attach permissions to request for optional use in controllers
      req.permissions = userPermissions;
      next();
    } catch (error) {
      return forbiddenResponse(res, 'Permission check failed');
    }
  };
};

/**
 * Clear permission cache (useful after role changes)
 */
const clearPermissionCache = (role) => {
  if (role) {
    delete permissionCache[role];
  } else {
    Object.keys(permissionCache).forEach(k => delete permissionCache[k]);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireCustomer,
  requireUser,
  allowGuestOrUser,
  requireRoles,
  requirePermission,
  clearPermissionCache
};
