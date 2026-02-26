const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require('../../utils/response');
const { VALID_REGIONS } = require('../addresses/addresses.validators');

/**
 * Delivery Fee Calculation Logic (centralized)
 * @param {string} region - The shipping region
 * @param {number} cartTotal - The cart total in ILS
 * @returns {{ shipping_fees: number, free_threshold: number }}
 */
const calculateDeliveryFee = (region, cartTotal) => {
    const DEFAULT_FEE = 20;
    let shipping_fees = DEFAULT_FEE;
    let free_threshold = 70; // Default for all other regions

    if (region === 'عتيل - جبل المصرية') {
        free_threshold = 30;
        if (cartTotal > 30) shipping_fees = 0;
    } else if (region === 'عتيل - عتيل') {
        free_threshold = 50;
        if (cartTotal > 50) shipping_fees = 0;
    } else {
        free_threshold = 70;
        if (cartTotal > 70) shipping_fees = 0;
    }

    return { shipping_fees, free_threshold };
};

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: حساب رسوم التوصيل والمناطق المدعومة
 */

/**
 * @swagger
 * /api/shipping/regions:
 *   get:
 *     summary: قائمة المناطق المدعومة للتوصيل
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: قائمة المناطق
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/regions', (req, res) => {
    return successResponse(res, VALID_REGIONS, 'Supported shipping regions');
});

/**
 * @swagger
 * /api/shipping/calculate:
 *   get:
 *     summary: حساب رسوم التوصيل بناءً على المنطقة ومجموع السلة
 *     tags: [Shipping]
 *     parameters:
 *       - in: query
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: اسم المنطقة (بالعربي)
 *       - in: query
 *         name: cart_total
 *         required: true
 *         schema:
 *           type: number
 *         description: مجموع سعر المنتجات بالشيكل
 *     responses:
 *       200:
 *         description: تفاصيل رسوم التوصيل
 *       400:
 *         description: منطقة غير صالحة أو مجموع غير صحيح
 */
router.get('/calculate', (req, res) => {
    const { region, cart_total } = req.query;

    if (!region || !cart_total) {
        return errorResponse(res, 'region and cart_total are required', 400);
    }

    if (!VALID_REGIONS.includes(region)) {
        return errorResponse(res, 'Invalid region. Please select a supported region.', 400);
    }

    const cartTotal = parseFloat(cart_total);
    if (isNaN(cartTotal) || cartTotal < 0) {
        return errorResponse(res, 'cart_total must be a valid positive number', 400);
    }

    const { shipping_fees, free_threshold } = calculateDeliveryFee(region, cartTotal);
    const final_total = Math.round((cartTotal + shipping_fees) * 100) / 100;

    return successResponse(res, {
        region,
        cart_total: cartTotal,
        shipping_fees,
        free_threshold,
        final_total
    }, 'Delivery fee calculated');
});

module.exports = router;
module.exports.calculateDeliveryFee = calculateDeliveryFee;
