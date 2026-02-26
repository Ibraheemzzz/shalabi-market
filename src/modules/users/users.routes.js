const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: عرض الملف الشخصي
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: بيانات المستخدم + إحصائياته
 *   put:
 *     summary: تعديل الملف الشخصي (الاسم / كلمة المرور)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               current_password:
 *                 type: string
 *                 description: مطلوب فقط عند تغيير كلمة المرور
 *     responses:
 *       200:
 *         description: تم التعديل
 */
router.get('/profile', authenticate, requireUser, usersController.getProfile);
router.put('/profile', authenticate, requireUser, usersController.updateProfile);

/**
 * @swagger
 * /api/users/change-phone:
 *   post:
 *     summary: طلب تغيير رقم الهاتف — يرسل OTP للرقم الجديد
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_phone_number]
 *             properties:
 *               new_phone_number:
 *                 type: string
 *                 example: "0599876543"
 *     responses:
 *       200:
 *         description: تم إرسال رمز التحقق للرقم الجديد
 *       409:
 *         description: الرقم مسجّل لحساب آخر
 */
router.post('/change-phone', authenticate, requireUser, usersController.requestPhoneChange);

/**
 * @swagger
 * /api/users/verify-phone-change:
 *   post:
 *     summary: تأكيد تغيير الرقم عبر OTP
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_phone_number, otp_code]
 *             properties:
 *               new_phone_number:
 *                 type: string
 *               otp_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تغيير الرقم بنجاح
 *       400:
 *         description: OTP غير صحيح
 */
router.post('/verify-phone-change', authenticate, requireUser, usersController.verifyPhoneChange);

module.exports = router;
