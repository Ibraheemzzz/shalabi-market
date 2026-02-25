const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');

/**
 * User Profile Routes
 * Mounted at: /api/users
 */

// GET /api/users/profile  → get own profile
router.get('/profile', authenticate, requireUser, usersController.getProfile);

// PUT /api/users/profile  → update own profile
router.put('/profile', authenticate, requireUser, usersController.updateProfile);

module.exports = router;
