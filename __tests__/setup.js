// Jest global setup for tests
// Ensures required environment variables exist during test runs
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_change_me_min_32_chars';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.JWT_GUEST_EXPIRES_IN = process.env.JWT_GUEST_EXPIRES_IN || '1d';

// Keep CORS permissive in tests
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '';
