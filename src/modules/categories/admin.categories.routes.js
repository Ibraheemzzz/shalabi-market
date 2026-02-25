const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { authenticate, requireAdmin } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const categoriesValidators = require('./categories.validators');

/**
 * Admin Categories Routes
 * Mounted at: /api/admin/categories
 * All routes require Admin role
 */

// POST /api/admin/categories        → create category
router.post('/', authenticate, requireAdmin, categoriesValidators.create, validate, categoriesController.createCategory);

// PUT /api/admin/categories/:id     → update category
router.put('/:id', authenticate, requireAdmin, categoriesValidators.update, validate, categoriesController.updateCategory);

// DELETE /api/admin/categories/:id  → delete category
router.delete('/:id', authenticate, requireAdmin, categoriesController.deleteCategory);

module.exports = router;
