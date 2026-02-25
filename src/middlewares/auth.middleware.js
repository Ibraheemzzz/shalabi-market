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
  
  if (req.user.role !== 'Admin') {
    return forbiddenResponse(res, 'Admin access required');
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

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireCustomer,
  requireUser,
  allowGuestOrUser,
  requireRoles
};
