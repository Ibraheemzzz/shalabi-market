const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: عرض المنتجات (عام)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, popular]
 *     responses:
 *       200:
 *         description: قائمة المنتجات مع pagination
 */
router.get('/', productsController.getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: تفاصيل منتج محدد
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: بيانات المنتج
 *       404:
 *         description: المنتج غير موجود
 */
router.get('/:id', productsController.getProductById);

module.exports = router;
