const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const categoriesValidators = require('./categories.validators');

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: إنشاء تصنيف جديد
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "أجهزة إلكترونية"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء التصنيف
 *       403:
 *         description: "صلاحية مطلوبة: category.manage"
 */
router.post('/', authenticate, requirePermission('category.manage'), categoriesValidators.create, validate, categoriesController.createCategory);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     summary: تعديل تصنيف
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: تم تعديل التصنيف
 *       403:
 *         description: "صلاحية مطلوبة: category.manage"
 *   delete:
 *     summary: حذف تصنيف
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: تم حذف التصنيف
 *       403:
 *         description: "صلاحية مطلوبة: category.manage"
 */
router.put('/:id', authenticate, requirePermission('category.manage'), categoriesValidators.update, validate, categoriesController.updateCategory);
router.delete('/:id', authenticate, requirePermission('category.manage'), categoriesController.deleteCategory);

module.exports = router;
