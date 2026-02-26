const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const reviewsValidators = require('./reviews.validators');

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: جميع التقييمات
 *     tags: [Admin - Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة التقييمات
 *       403:
 *         description: "صلاحية مطلوبة: product.edit"
 */
router.get('/', authenticate, requirePermission('product.edit'), reviewsController.getAllReviews);

/**
 * @swagger
 * /api/admin/reviews/{id}/hide:
 *   put:
 *     summary: إخفاء / إظهار تقييم
 *     tags: [Admin - Reviews]
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
 *         description: تم تغيير حالة العرض
 *       403:
 *         description: "صلاحية مطلوبة: product.edit"
 */
router.put('/:id/hide', authenticate, requirePermission('product.edit'), reviewsValidators.toggleVisibility, validate, reviewsController.toggleReviewVisibility);

module.exports = router;
