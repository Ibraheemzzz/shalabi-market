const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate, requireAdmin } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const reviewsValidators = require('./reviews.validators');

/**
 * Admin Reviews Routes
 * Mounted at: /api/admin/reviews
 * All routes require Admin role
 */

// GET /api/admin/reviews          → list all reviews (with pagination)
router.get('/', authenticate, requireAdmin, reviewsController.getAllReviews);

// PUT /api/admin/reviews/:id/hide → toggle review visibility
// NOTE: must be before /:id to avoid "hide" being treated as an id
router.put('/:id/hide', authenticate, requireAdmin, reviewsValidators.toggleVisibility, validate, reviewsController.toggleReviewVisibility);

module.exports = router;
