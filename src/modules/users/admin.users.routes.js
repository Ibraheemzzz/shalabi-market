const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: قائمة جميع المستخدمين
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: بحث بالاسم أو رقم الهاتف
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: قائمة المستخدمين مع pagination
 *       403:
 *         description: "صلاحية مطلوبة: user.view"
 */
router.get('/', authenticate, requirePermission('user.view'), usersController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: بيانات مستخدم محدد
 *     tags: [Admin - Users]
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
 *         description: بيانات المستخدم + إحصائياته
 *       403:
 *         description: "صلاحية مطلوبة: user.view"
 *       404:
 *         description: المستخدم غير موجود
 */
router.get('/:id', authenticate, requirePermission('user.view'), usersController.getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: تفعيل / تعطيل حساب مستخدم
 *     tags: [Admin - Users]
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
 *         description: تم تغيير حالة الحساب
 *       403:
 *         description: "صلاحية مطلوبة: user.ban"
 */
router.put('/:id/status', authenticate, requirePermission('user.ban'), usersController.toggleUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: تغيير دور المستخدم
 *     tags: [Admin - Users]
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
 *               role:
 *                 type: string
 *                 enum: [Customer, Guest, Admin, ProductManager, OrderManager]
 *     responses:
 *       200:
 *         description: تم تغيير دور المستخدم
 *       403:
 *         description: "صلاحية مطلوبة: user.ban"
 */
router.put('/:id/role', authenticate, requirePermission('user.ban'), usersController.changeUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/orders:
 *   get:
 *     summary: جلب طلبات مستخدم معين (سجل المشتريات)
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: قائمة طلبات المستخدم
 *       403:
 *         description: "صلاحية مطلوبة: user.view"
 */
router.get('/:id/orders', authenticate, requirePermission('user.view'), usersController.getUserOrders);


module.exports = router;
