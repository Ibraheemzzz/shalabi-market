const express = require('express');
const router = express.Router();
const addressesController = require('./addresses.controller');
const validators = require('./addresses.validators');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate, requireUser } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: إدارة عناوين شحن المستخدمين
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: عرض قائمة عناوين المستخدم
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: نجاح
 *   post:
 *     summary: إضافة عنوان جديد
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, phone_number, region, street]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               region:
 *                 type: string
 *                 description: |
 *                   المنطقة بالتحديد (مثال: عتيل - جبل المصرية, طولكرم). 
 *                   يجب أن تكون من قائمة المناطق المحددة لحساب رسوم التوصيل بشكل صحيح.
 *               street:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: تم إضافة العنوان
 */
router.route('/')
    .get(authenticate, requireUser, addressesController.getUserAddresses)
    .post(authenticate, requireUser, validators.createAddress, validate, addressesController.addAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: تعديل عنوان
 *     tags: [Addresses]
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
 *             properties: # Same as POST
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               region:
 *                 type: string
 *               street:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف عنوان
 *     tags: [Addresses]
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
 *         description: تم الحذف
 */
router.route('/:id')
    .put(authenticate, requireUser, validators.checkAddressId, validators.updateAddress, validate, addressesController.updateAddress)
    .delete(authenticate, requireUser, validators.checkAddressId, validate, addressesController.deleteAddress);

/**
 * @swagger
 * /api/addresses/{id}/default:
 *   put:
 *     summary: تعيين كعنوان افتراضي
 *     tags: [Addresses]
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
 *         description: تم التحديث
 */
router.put('/:id/default', authenticate, requireUser, validators.checkAddressId, validate, addressesController.setDefaultAddress);

module.exports = router;
