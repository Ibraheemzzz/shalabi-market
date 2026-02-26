/**
 * Auth Module — Unit & Integration Tests
 * 
 * Run:  npm test
 * Coverage: npm run test:coverage
 * 
 * NOTE: These tests mock Prisma & bcrypt so no real DB is needed.
 */

const request = require('supertest');

// ─── Mock prisma BEFORE requiring app ─────────────────────────────────────────
jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  guest: {
    create: jest.fn()
  },
  otpCode: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn()
  },
  $disconnect: jest.fn()
}));

jest.mock('../src/utils/sms', () => ({
  sendOTP: jest.fn()
}));

const prisma = require('../src/config/prisma');
const app = require('../src/app');

// ─── Helpers ───────────────────────────────────────────────────────────────────
const validUser = {
  phone_number: '0599123456',
  name: 'Test User',
  password: 'Password123'
};

// ─── POST /api/auth/register ───────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ registers a new user and returns 201', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      user_id: 1,
      phone_number: validUser.phone_number,
      name: validUser.name,
      role: 'Customer',
      created_at: new Date()
    });

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Registration successful/i);
  });

  it('❌ returns 409 when phone number already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ user_id: 1, phone_number: validUser.phone_number, is_verified: true });

    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('❌ returns 400 for missing phone_number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'phone_number' })
      ])
    );
  });

  it('❌ returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'password' })
      ])
    );
  });

  it('❌ returns 400 for empty body', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ logs in with correct credentials and returns token', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(validUser.password, 10);

    prisma.user.findUnique.mockResolvedValue({
      user_id: 1,
      phone_number: validUser.phone_number,
      name: validUser.name,
      role: 'Customer',
      is_active: true,
      is_verified: true,
      password_hash: hash
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone_number: validUser.phone_number, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  it('❌ returns 401 for wrong password', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correctpassword', 10);

    prisma.user.findUnique.mockResolvedValue({
      user_id: 1,
      phone_number: validUser.phone_number,
      is_active: true,
      is_verified: true,
      password_hash: hash
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone_number: validUser.phone_number, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('❌ returns 401 for non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone_number: '0500000000', password: 'anypassword' });

    expect(res.status).toBe(401);
  });

  it('❌ returns 403 for deactivated account', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(validUser.password, 10);

    prisma.user.findUnique.mockResolvedValue({
      user_id: 99,
      phone_number: validUser.phone_number,
      is_active: false,
      password_hash: hash
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone_number: validUser.phone_number, password: validUser.password });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('❌ returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('❌ returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('❌ returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ─── Security Headers ──────────────────────────────────────────────────────────
describe('Security Headers (Helmet)', () => {
  it('✅ sets X-Content-Type-Options header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('✅ sets X-Frame-Options header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
describe('404 Handler', () => {
  it('✅ returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
