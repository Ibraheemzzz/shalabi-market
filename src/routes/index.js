const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const categoriesRoutes = require('../modules/categories/categories.routes');
const productsRoutes = require('../modules/products/products.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const reviewsRoutes = require('../modules/reviews/reviews.routes');
const wishlistRoutes = require('../modules/wishlist/wishlist.routes');
const addressesRoutes = require('../modules/addresses/addresses.routes');
const shippingRoutes = require('../modules/shipping/shipping.routes');

const adminUsersRoutes = require('../modules/users/admin.users.routes');
const adminCategoriesRoutes = require('../modules/categories/admin.categories.routes');
const adminProductsRoutes = require('../modules/products/admin.products.routes');
const adminOrdersRoutes = require('../modules/orders/admin.orders.routes');
const adminReviewsRoutes = require('../modules/reviews/admin.reviews.routes');
const reportsRoutes = require('../modules/reports/reports.routes');

const publicRoutes = [
  ['/api/auth', authRoutes],
  ['/api/users', usersRoutes],
  ['/api/categories', categoriesRoutes],
  ['/api/products', productsRoutes],
  ['/api/cart', cartRoutes],
  ['/api/orders', ordersRoutes],
  ['/api', reviewsRoutes],
  ['/api/wishlist', wishlistRoutes],
  ['/api/addresses', addressesRoutes],
  ['/api/shipping', shippingRoutes]
];

const adminRoutes = [
  ['/api/admin/users', adminUsersRoutes],
  ['/api/admin/categories', adminCategoriesRoutes],
  ['/api/admin/products', adminProductsRoutes],
  ['/api/admin/orders', adminOrdersRoutes],
  ['/api/admin/reviews', adminReviewsRoutes],
  ['/api/admin', reportsRoutes]
];

const registerApiRoutes = (app) => {
  publicRoutes.forEach(([path, route]) => app.use(path, route));
  adminRoutes.forEach(([path, route]) => app.use(path, route));
};

module.exports = {
  registerApiRoutes
};