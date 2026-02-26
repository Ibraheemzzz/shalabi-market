const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticate, requirePermission } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/admin/reports/dashboard-summary:
 *   get:
 *     summary: ملخص لوحة التحكم
 *     description: "طلبات اليوم، الإيرادات، المخزون المنخفض، المستخدمين الجدد"
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ملخص اليوم
 *       403:
 *         description: "صلاحية مطلوبة: report.view"
 */
router.get('/reports/dashboard-summary', authenticate, requirePermission('report.view'), reportsController.getDashboardSummary);

/**
 * @swagger
 * /api/admin/reports/sales:
 *   get:
 *     summary: تقرير المبيعات
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: بيانات المبيعات
 */
router.get('/reports/sales', authenticate, requirePermission('report.view'), reportsController.getSalesReport);

/**
 * @swagger
 * /api/admin/reports/top-products:
 *   get:
 *     summary: المنتجات الأكثر مبيعاً
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة المنتجات الأكثر مبيعاً
 */
router.get('/reports/top-products', authenticate, requirePermission('report.view'), reportsController.getTopProducts);

/**
 * @swagger
 * /api/admin/reports/low-stock:
 *   get:
 *     summary: المنتجات منخفضة المخزون
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: منتجات تحتاج إعادة تخزين
 */
router.get('/reports/low-stock', authenticate, requirePermission('report.view'), reportsController.getLowStockProducts);

/**
 * @swagger
 * /api/admin/reports/profit:
 *   get:
 *     summary: تقرير الأرباح
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: بيانات الأرباح
 */
router.get('/reports/profit', authenticate, requirePermission('report.view'), reportsController.getProfitReport);

/**
 * @swagger
 * /api/admin/reports/category-sales:
 *   get:
 *     summary: المبيعات حسب التصنيف
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: توزيع المبيعات على التصنيفات
 */
router.get('/reports/category-sales', authenticate, requirePermission('report.view'), reportsController.getCategorySales);

/**
 * @swagger
 * /api/admin/reports/order-status:
 *   get:
 *     summary: توزيع حالات الطلبات
 *     tags: [Admin - Reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: إحصائية حالات الطلبات
 */
router.get('/reports/order-status', authenticate, requirePermission('report.view'), reportsController.getOrderStatusDistribution);

module.exports = router;
