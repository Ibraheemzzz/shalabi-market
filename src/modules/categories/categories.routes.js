const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: التصنيفات كشجرة هرمية
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: شجرة التصنيفات
 */
router.get('/', categoriesController.getCategoryTree);

/**
 * @swagger
 * /api/categories/list:
 *   get:
 *     summary: قائمة التصنيفات المسطّحة
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: قائمة مسطحة
 */
router.get('/list', categoriesController.getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: تصنيف محدد
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: بيانات التصنيف
 */
router.get('/:id', categoriesController.getCategoryById);

module.exports = router;
