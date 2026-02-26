const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { uploadProductImage, handleMulterError } = require('../../config/multer');
const { uploadLimiter } = require('../../middlewares/rateLimit.middleware');
const productsValidators = require('./products.validators');

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: جميع المنتجات (بما فيها المخفية)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة جميع المنتجات
 *       403:
 *         description: "صلاحية مطلوبة: product.view_all"
 *   post:
 *     summary: إنشاء منتج جديد
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, category_id]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               cost_price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: تم إنشاء المنتج
 *       403:
 *         description: "صلاحية مطلوبة: product.create"
 */
router.get('/', authenticate, requirePermission('product.view_all'), productsController.getAllProductsAdmin);
router.post(
  '/',
  authenticate,
  requirePermission('product.create'),
  uploadLimiter,
  uploadProductImage.single('image'),
  handleMulterError,
  productsValidators.create,
  validate,
  productsController.createProduct
);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   put:
 *     summary: تعديل منتج
 *     tags: [Admin - Products]
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
 *         description: تم تعديل المنتج
 *       403:
 *         description: "صلاحية مطلوبة: product.edit"
 *   delete:
 *     summary: حذف منتج (soft delete)
 *     tags: [Admin - Products]
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
 *         description: تم حذف المنتج
 *       403:
 *         description: "صلاحية مطلوبة: product.delete"
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('product.edit'),
  uploadLimiter,
  uploadProductImage.single('image'),
  handleMulterError,
  productsValidators.update,
  validate,
  productsController.updateProduct
);
router.delete('/:id', authenticate, requirePermission('product.delete'), productsController.deleteProduct);

/**
 * @swagger
 * /api/admin/products/{id}/stock:
 *   post:
 *     summary: تعديل المخزون
 *     tags: [Admin - Products]
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
 *         description: تم تعديل المخزون
 *       403:
 *         description: "صلاحية مطلوبة: product.edit"
 */
router.post('/:id/stock', authenticate, requirePermission('product.edit'), productsValidators.adjustStock, validate, productsController.adjustStock);

/**
 * @swagger
 * /api/admin/products/{id}/stock-history:
 *   get:
 *     summary: سجل حركات المخزون
 *     tags: [Admin - Products]
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
 *         description: سجل الحركات
 *       403:
 *         description: "صلاحية مطلوبة: product.view_all"
 */
router.get('/:id/stock-history', authenticate, requirePermission('product.view_all'), productsController.getStockHistory);

module.exports = router;
