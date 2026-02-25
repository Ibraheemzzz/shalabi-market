const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authenticate, allowGuestOrUser, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const ordersValidators = require('./orders.validators');

/**
 * User / Guest Orders Routes
 * Mounted at: /api/orders
 */

// POST /api/orders         → place order (user or guest)
router.post('/', authenticate, allowGuestOrUser, ordersValidators.placeOrder, validate, ordersController.placeOrder);

// GET  /api/orders         → list my orders
router.get('/', authenticate, allowGuestOrUser, ordersController.getOrders);

// PUT  /api/orders/:id/cancel → cancel an order (registered users only)
// NOTE: must be before /:id to avoid "cancel" being treated as an id
router.put('/:id/cancel', authenticate, requireUser, ordersValidators.cancelOrder, validate, ordersController.cancelOrder);

// GET  /api/orders/:id     → get order by ID
router.get('/:id', authenticate, allowGuestOrUser, ordersController.getOrderById);

module.exports = router;
