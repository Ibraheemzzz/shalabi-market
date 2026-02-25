const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authenticate, requireAdmin } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { uploadProductImage, handleMulterError } = require('../../config/multer');
const { uploadLimiter } = require('../../middlewares/rateLimit.middleware');
const productsValidators = require('./products.validators');

/**
 * Admin Products Routes
 * Mounted at: /api/admin/products
 * All routes require Admin role
 */

// GET    /api/admin/products              → all products including inactive
router.get('/', authenticate, requireAdmin, productsController.getAllProductsAdmin);

// POST   /api/admin/products              → create product (with image upload)
router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadLimiter,
  uploadProductImage.single('image'),
  handleMulterError,
  productsValidators.create,
  validate,
  productsController.createProduct
);

// PUT    /api/admin/products/:id          → update product (with optional image)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadLimiter,
  uploadProductImage.single('image'),
  handleMulterError,
  productsValidators.update,
  validate,
  productsController.updateProduct
);

// DELETE /api/admin/products/:id          → soft delete product
router.delete('/:id', authenticate, requireAdmin, productsController.deleteProduct);

// POST   /api/admin/products/:id/stock    → adjust stock
router.post('/:id/stock', authenticate, requireAdmin, productsValidators.adjustStock, validate, productsController.adjustStock);

// GET    /api/admin/products/:id/stock-history → stock transaction history
router.get('/:id/stock-history', authenticate, requireAdmin, productsController.getStockHistory);

module.exports = router;
