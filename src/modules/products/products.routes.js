const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');

/**
 * Public Products Routes
 * Mounted at: /api/products
 */

// GET /api/products      → list products (public)
router.get('/', productsController.getProducts);

// GET /api/products/:id  → single product (public)
router.get('/:id', productsController.getProductById);

module.exports = router;
