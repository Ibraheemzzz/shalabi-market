const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { param } = require('express-validator');

const productIdParam = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: عرض قائمة الأمنيات
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة المنتجات المفضلة
 *   delete:
 *     summary: تفريغ قائمة الأمنيات
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم التنظيف
 */
router.get('/', authenticate, requireUser, wishlistController.getWishlist);
router.delete('/', authenticate, requireUser, wishlistController.clearWishlist);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   get:
 *     summary: هل المنتج في قائمة الأمنيات؟
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: حالة التواجد
 *   post:
 *     summary: إضافة منتج لقائمة الأمنيات
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: تم الإضافة
 *   delete:
 *     summary: إزالة منتج من قائمة الأمنيات
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: تم الحذف
 */
router.get('/:productId', authenticate, requireUser, productIdParam, validate, wishlistController.checkWishlist);
router.post('/:productId', authenticate, requireUser, productIdParam, validate, wishlistController.addToWishlist);
router.delete('/:productId', authenticate, requireUser, productIdParam, validate, wishlistController.removeFromWishlist);

/**
 * @swagger
 * /api/wishlist/{productId}/toggle:
 *   patch:
 *     summary: تبديل حالة المنتج في قائمة الأمنيات (إضافة/حذف)
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: تم التبديل بنجاح
 */
router.patch('/:productId/toggle', authenticate, requireUser, productIdParam, validate, wishlistController.toggleWishlist);

module.exports = router;
