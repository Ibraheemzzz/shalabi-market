const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const reviewsValidators = require('./reviews.validators');

/**
 * @swagger
 * /api/products/{productId}/reviews:
 *   get:
 *     summary: عرض تقييمات منتج
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: قائمة التقييمات العامة للمنتج
 *   post:
 *     summary: إضافة تقييم لمنتج
 *     tags: [Reviews]
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
 *             required: [rating, comment]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إضافة التقييم
 */
router.post('/products/:productId/reviews', authenticate, requireUser, reviewsValidators.create, validate, reviewsController.createReview);
router.get('/products/:productId/reviews', reviewsController.getProductReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: تعديل تقييمي
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تعديل التقييم
 *   delete:
 *     summary: حذف تقييمي
 *     tags: [Reviews]
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
 *         description: تم حذف التقييم
 */
router.put('/reviews/:id', authenticate, requireUser, reviewsValidators.update, validate, reviewsController.updateReview);
router.delete('/reviews/:id', authenticate, requireUser, reviewsController.deleteReview);

module.exports = router;
