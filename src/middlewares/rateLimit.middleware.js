const rateLimit = require('express-rate-limit');

// ─── Shared response format ────────────────────────────────────────────────────
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    data: null
  });
};

// ─── Auth (Login) Limiter ─────────────────────────────────────────────────────
// Strict limit for login to prevent brute-force attacks
// Counts failures only (successful logins do not consume the quota)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 10,                     // max 10 attempts per window
  standardHeaders: true,       // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler(
    'Too many login attempts. Please try again after 15 minutes.'
  )
});

const registerMax = Number(process.env.REGISTER_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 10 : 20);

// ─── Auth (Register) Limiter ──────────────────────────────────────────────────
// Prevent mass account creation (counts ALL requests)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: registerMax,            // registrations per hour per IP (prod default 10, dev default 20)
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many registration attempts. Please try again later.'
  )
});

// ─── General API Limiter ──────────────────────────────────────────────────────
// Generous limit for normal API usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 300,                    // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many requests from this IP. Please try again after 15 minutes.'
  )
});

// ─── Upload Limiter ───────────────────────────────────────────────────────────
// Limit file upload requests (more expensive operations)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 50,                     // 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Upload limit reached. Please try again after 1 hour.'
  )
});

// ─── Guest Creation Limiter ───────────────────────────────────────────────────
// Prevent mass guest account creation
const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 5,                      // 5 guest sessions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Guest session limit reached. Please register for a full account.'
  )
});

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  uploadLimiter,
  guestLimiter
};
