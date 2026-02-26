const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authenticate, allowGuestOrUser, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const ordersValidators = require('./orders.validators');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: عرض طلباتي
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة الطلبات الخاصة بالمستخدم
 *   post:
 *     summary: إتمام الطلب (Checkout)
 *     description: متاح للمستخدمين المسجلين والزوار
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: number
 *               address_id:
 *                 type: integer
 *                 description: معرف العنوان المحفوظ للمستخدم (للمسجلين فقط - اختياري إذا أرسلت تفاصيل العنوان يدوياً)
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               region:
 *                 type: string
 *                 description: |
 *                   المنطقة (مثال: عتيل - جبل المصرية). 
 *                   مطلوب إذا لم يتم توفير address_id.
 *               street:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [cash_on_delivery]
 *               coupon_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الطلب بنجاح
 */
router.post('/', authenticate, allowGuestOrUser, ordersValidators.placeOrder, validate, ordersController.placeOrder);
router.get('/', authenticate, allowGuestOrUser, ordersController.getOrders);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: إلغاء طلبي
 *     tags: [Orders]
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
 *         description: تم إلغاء الطلب
 *       400:
 *         description: لا يمكن إلغاء الطلب في حالته الحالية
 */
router.put('/:id/cancel', authenticate, requireUser, ordersValidators.cancelOrder, validate, ordersController.cancelOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: تفاصيل طلب محدد
 *     tags: [Orders]
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
 *         description: بيانات الطلب مع العناصر وحالات السجل
 */
router.get('/:id', authenticate, allowGuestOrUser, ordersController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: فاتورة الطلب (قابلة للطباعة)
 *     description: تعرض بيانات الفاتورة الكاملة بما في ذلك معلومات المتجر والعميل والمنتجات والمبالغ وطريقة الدفع
 *     tags: [Orders]
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
 *         description: بيانات الفاتورة الكاملة
 *       404:
 *         description: الطلب غير موجود
 */
router.get('/:id/invoice', authenticate, allowGuestOrUser, ordersController.getOrderInvoice);

/**
 * @swagger
 * /api/orders/guest-invoice/{id}:
 *   get:
 *     summary: عرض فاتورة لضيف باستخدام رقم الهاتف
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: الفاتورة المستردة بنجاح
 */
router.get('/guest-invoice/:id', ordersController.getGuestInvoice);

module.exports = router;
