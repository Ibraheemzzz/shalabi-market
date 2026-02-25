const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authenticate, requireAdmin } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const ordersValidators = require('./orders.validators');

/**
 * Admin Orders Routes
 * Mounted at: /api/admin/orders
 * All routes require Admin role
 */

// GET /api/admin/orders/all         → all orders (with status filter & pagination)
// NOTE: must be before /:id to avoid "all" being treated as an id
router.get('/all', authenticate, requireAdmin, ordersController.getAllOrders);

// PUT /api/admin/orders/:id/status  → change order status
router.put('/:id/status', authenticate, requireAdmin, ordersValidators.changeStatus, validate, ordersController.changeOrderStatus);

// GET /api/admin/orders/:id/history → order status history
router.get('/:id/history', authenticate, requireAdmin, ordersController.getOrderStatusHistory);

module.exports = router;
