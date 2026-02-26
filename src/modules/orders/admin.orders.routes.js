const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const ordersValidators = require('./orders.validators');

/**
 * @swagger
 * /api/admin/orders/all:
 *   get:
 *     summary: جميع الطلبات (مع فلترة وتصفّح)
 *     tags: [Admin - Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Confirmed, Shipped, Delivered, Cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: قائمة الطلبات
 *       403:
 *         description: "صلاحية مطلوبة: order.view"
 */
router.get('/all', authenticate, requirePermission('order.view'), ordersController.getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: تفاصيل طلب محدد (للأدمن)
 *     tags: [Admin - Orders]
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
 *         description: تفاصيل الطلب
 *       404:
 *         description: الطلب غير موجود
 *       403:
 *         description: "صلاحية مطلوبة: order.view"
 */
router.get('/:id', authenticate, requirePermission('order.view'), ordersController.getAdminOrderById);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   put:
 *     summary: تغيير حالة طلب
 *     tags: [Admin - Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Confirmed, Shipped, Delivered, Cancelled]
 *     responses:
 *       200:
 *         description: تم تحديث حالة الطلب
 *       403:
 *         description: "صلاحية مطلوبة: order.update_status"
 */
router.put('/:id/status', authenticate, requirePermission('order.update_status'), ordersValidators.changeStatus, validate, ordersController.changeOrderStatus);

/**
 * @swagger
 * /api/admin/orders/{id}/history:
 *   get:
 *     summary: سجل تغييرات حالة الطلب
 *     tags: [Admin - Orders]
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
 *         description: سجل الحالات
 *       403:
 *         description: "صلاحية مطلوبة: order.view"
 */
router.get('/:id/history', authenticate, requirePermission('order.view'), ordersController.getOrderStatusHistory);

module.exports = router;
