const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { authenticate, allowGuestOrUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const cartValidators = require('./cart.validators');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: عرض محتويات السلة
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: محتويات السلة مع الإجماليات
 *   delete:
 *     summary: تفريغ السلة بالكامل
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم تفريغ السلة
 */
router.get('/', authenticate, allowGuestOrUser, cartController.getCart);
router.delete('/', authenticate, allowGuestOrUser, cartController.clearCart);

/**
 * @swagger
 * /api/cart/validate:
 *   get:
 *     summary: التحقق من توفر المنتجات في السلة
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: نتيجة التحقق
 */
router.get('/validate', authenticate, allowGuestOrUser, cartController.validateCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: إضافة منتج للسلة
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: تم الإضافة للسلة
 */
router.post('/items', authenticate, allowGuestOrUser, cartValidators.addToCart, validate, cartController.addToCart);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   put:
 *     summary: تحديث كمية منتج في السلة
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: تم تحديث الكمية
 *   delete:
 *     summary: حذف منتج من السلة
 *     tags: [Cart]
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
 *         description: تم حذف المنتج من السلة
 */
router.put('/items/:productId', authenticate, allowGuestOrUser, cartValidators.updateCartItem, validate, cartController.updateCartItem);
router.delete('/items/:productId', authenticate, allowGuestOrUser, cartValidators.removeFromCart, validate, cartController.removeFromCart);

module.exports = router;

