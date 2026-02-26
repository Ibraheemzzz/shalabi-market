require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const logger = require('./config/logger');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const productsRoutes = require('./modules/products/products.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const addressesRoutes = require('./modules/addresses/addresses.routes');
const shippingRoutes = require('./modules/shipping/shipping.routes');

// ─── Admin-only Route Imports ─────────────────────────────────────────────────
const adminUsersRoutes = require('./modules/users/admin.users.routes');
const adminCategoriesRoutes = require('./modules/categories/admin.categories.routes');
const adminProductsRoutes = require('./modules/products/admin.products.routes');
const adminOrdersRoutes = require('./modules/orders/admin.orders.routes');
const adminReviewsRoutes = require('./modules/reviews/admin.reviews.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const app = express();

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

// Normalize common local dev origins to avoid needless CORS blocks (localhost vs 127.0.0.1)
// Keeps production strict: only exact matches are allowed unless your env includes them.
const normalizeOrigin = (origin) => {
  try {
    const u = new URL(origin);
    const hostname = u.hostname === 'localhost' ? '127.0.0.1' : u.hostname;
    const protocol = u.protocol.toLowerCase();
    const port = u.port ? `:${u.port}` : '';
    return `${protocol}//${hostname}${port}`;
  } catch {
    return origin;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;

  // Production: keep strict, exact-match only
  if (process.env.NODE_ENV === 'production') {
    return allowedOrigins.includes(origin);
  }

  // Development: allow normalized localhost/127.0.0.1 equivalents to reduce friction
  const normalized = normalizeOrigin(origin);
  const normalizedAllowed = allowedOrigins.map(normalizeOrigin);

  return allowedOrigins.includes(origin) || normalizedAllowed.includes(normalized);
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true
}));


// ─── HTTP Request Logging (Morgan → Winston) ──────────────────────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: logger.stream,
  skip: () => process.env.NODE_ENV === 'test'
}));

// ─── Global API Rate Limit ────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ─── Static Files ─────────────────────────────────────────────────────────────
const uploadBasePath = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../uploads');

app.use('/uploads', express.static(uploadBasePath));

// ─── Root & Health ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to Shalabi Market E-Commerce API', data: { version: '1.0.0', health: '/api/health' } });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Shalabi Market API is running', data: { version: '1.0.0', timestamp: new Date().toISOString() } });
});

// ─── Public / User API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api', reviewsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/shipping', shippingRoutes);

// ─── Admin API Routes ─────────────────────────────────────────────────────────
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/reviews', adminReviewsRoutes);
app.use('/api/admin', reportsRoutes);

// ─── Swagger API Documentation ────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Shalabi Market API Docs'
}));

// Serve raw spec as JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Frontend Static Files (For Monolithic Deployment) ──────────────────────
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// ─── SPA Catch-all Route ──────────────────────────────────────────────────────
// This should be the very last route before global error handlers.
// It ensures that React/Vue/Angular frontend router handles all non-API paths.
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    // If it was meant for the API but wasn't found, let the 404 handler catch it
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ success: false, message: 'Frontend index.html not found. Make sure to build the frontend into the backend public directory.', data: null });
    }
  });
});

// ─── 404 API Handler ──────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found', data: null });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id ?? null
  });

  if (err.message?.startsWith('CORS:'))
    return res.status(403).json({ success: false, message: err.message, data: null });
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token', data: null });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token expired', data: null });
  if (err.name === 'ValidationError')
    return res.status(400).json({ success: false, message: err.message, data: null });
  if (err.code === '23505')
    return res.status(409).json({ success: false, message: 'Duplicate entry', data: null });
  if (err.code === '23503')
    return res.status(400).json({ success: false, message: 'Referenced record not found', data: null });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    data: null
  });
});

module.exports = app;
