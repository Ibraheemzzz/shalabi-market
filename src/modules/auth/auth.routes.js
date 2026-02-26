const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const authValidators = require('./auth.validators');
const { loginLimiter, registerLimiter, guestLimiter } = require('../../middlewares/rateLimit.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تسجيل حساب جديد
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       201:
 *         description: تم التسجيل وإرسال OTP
 *       409:
 *         description: رقم الهاتف مسجّل مسبقاً
 *       429:
 *         description: طلبات كثيرة
 */
router.post('/register', registerLimiter, authValidators.register, validate, authController.register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: تأكيد الحساب عبر OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: تم التأكيد — يرجع token + بيانات المستخدم
 *       400:
 *         description: رمز غير صحيح أو منتهي
 */
router.post('/verify-otp', authValidators.verifyOtp, validate, authController.verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: إعادة إرسال رمز التحقق
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginStep1'
 *     responses:
 *       200:
 *         description: تم إرسال الرمز
 */
router.post('/resend-otp', authValidators.resendOtp, validate, authController.resendOtp);

/**
 * @swagger
 * /api/auth/check-phone:
 *   post:
 *     summary: "الخطوة 1: التحقق من رقم الهاتف"
 *     description: يتحقق من وجود الرقم ويرجع اسم المستخدم للخطوة الثانية
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginStep1'
 *     responses:
 *       200:
 *         description: الرقم موجود — يرجع اسم المستخدم
 *       403:
 *         description: الحساب معطّل أو غير مؤكد
 *       404:
 *         description: الرقم غير مسجّل
 */
router.post('/check-phone', authValidators.checkPhone, validate, authController.checkPhone);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: "الخطوة 2: تسجيل الدخول بكلمة المرور"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginStep2'
 *     responses:
 *       200:
 *         description: نجاح — يرجع token + بيانات المستخدم + role + permissions
 *       401:
 *         description: كلمة مرور خاطئة
 *       429:
 *         description: محاولات كثيرة
 */
router.post('/login', loginLimiter, authValidators.login, validate, authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: تسجيل الخروج
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج
 */
router.post('/logout', authenticate, requireUser, authController.logout);

/**
 * @swagger
 * /api/auth/guest:
 *   post:
 *     summary: إنشاء جلسة زائر
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: تم إنشاء جلسة زائر — يرجع guest token
 */
router.post('/guest', guestLimiter, authValidators.guest, validate, authController.createGuest);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: بيانات المستخدم الحالي + صلاحياته
 *     description: يرجع بيانات المستخدم مع مصفوفة `permissions` لتحديد الواجهة
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: بيانات المستخدم
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: غير مصادق
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: نسيت كلمة المرور — إرسال OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginStep1'
 *     responses:
 *       200:
 *         description: تم إرسال رمز التحقق
 *       404:
 *         description: الرقم غير مسجّل
 */
router.post('/forgot-password', authValidators.forgotPassword, validate, authController.forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     summary: التحقق من صحة كود OTP لإعادة تعيين كلمة المرور
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: الكود صالح
 *       400:
 *         description: الكود منتهي أو خاطئ
 */
router.post('/verify-reset-otp', authValidators.verifyOtp, validate, authController.verifyResetOtp);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: إعادة تعيين كلمة المرور عبر OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح
 *       400:
 *         description: OTP غير صحيح
 */
router.post('/reset-password', authValidators.resetPassword, validate, authController.resetPassword);

module.exports = router;
