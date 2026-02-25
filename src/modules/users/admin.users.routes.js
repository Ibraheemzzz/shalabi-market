const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate, requireAdmin } = require('../../middlewares/auth.middleware');

/**
 * Admin Users Routes
 * Mounted at: /api/admin/users
 * All routes require Admin role
 */

// GET /api/admin/users            → list all users (with search & pagination)
router.get('/', authenticate, requireAdmin, usersController.getAllUsers);

// GET /api/admin/users/:id        → get user by ID
router.get('/:id', authenticate, requireAdmin, usersController.getUserById);

// PUT /api/admin/users/:id/status → toggle user active status
router.put('/:id/status', authenticate, requireAdmin, usersController.toggleUserStatus);

module.exports = router;
