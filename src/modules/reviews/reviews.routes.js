const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const reviewsValidators = require('./reviews.validators');

/**
 * Public & User Reviews Routes
 * Mounted at: /api
 * This gives us clean paths: /api/products/:productId/reviews and /api/reviews/:id
 */

// POST /api/products/:productId/reviews → create review (registered users only)
router.post('/products/:productId/reviews', authenticate, requireUser, reviewsValidators.create, validate, reviewsController.createReview);

// GET  /api/products/:productId/reviews → list product reviews (public)
router.get('/products/:productId/reviews', reviewsController.getProductReviews);

// PUT  /api/reviews/:id                 → edit own review
router.put('/reviews/:id', authenticate, requireUser, reviewsValidators.update, validate, reviewsController.updateReview);

// DELETE /api/reviews/:id               → delete own review
router.delete('/reviews/:id', authenticate, requireUser, reviewsController.deleteReview);

module.exports = router;
