const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');

/**
 * Public Categories Routes
 * Mounted at: /api/categories
 */

// GET /api/categories        → hierarchical tree
router.get('/', categoriesController.getCategoryTree);

// GET /api/categories/list   → flat list
// NOTE: must be defined before /:id to avoid "list" being treated as an id
router.get('/list', categoriesController.getAllCategories);

// GET /api/categories/:id    → single category
router.get('/:id', categoriesController.getCategoryById);

module.exports = router;
