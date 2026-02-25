# 🛒 Shalabi Market — E-Commerce REST API

A production-ready Node.js + Express + Prisma REST API for an e-commerce platform.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| ORM | Prisma 5 + PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Security | helmet · cors · express-rate-limit |
| Logging | Winston + Morgan |
| Testing | Jest + Supertest |

---

## 📁 Project Structure

```
src/
├── app.js                  # Express app setup (middleware, routes, error handler)
├── server.js               # HTTP server bootstrap + graceful shutdown
├── config/
│   ├── prisma.js           # Prisma client singleton
│   ├── multer.js           # File upload config
│   └── logger.js           # Winston logger
├── middlewares/
│   ├── auth.middleware.js  # JWT verify · requireAdmin · requireRoles()
│   ├── validate.middleware.js  # express-validator error formatter
│   └── rateLimit.middleware.js # loginLimiter · registerLimiter · guestLimiter · apiLimiter · uploadLimiter
├── modules/
│   ├── auth/               # register · login · logout · guest · me
│   ├── users/              # profile · admin user management
│   ├── products/           # CRUD + search + filters
│   ├── categories/         # CRUD
│   ├── cart/               # add · update · remove · clear
│   ├── orders/             # place · track · cancel
│   ├── reviews/            # create · list · admin moderate
│   ├── wishlist/           # add · remove · list
│   └── reports/            # admin analytics
└── utils/
    ├── response.js         # Unified JSON response helpers
    └── pagination.js       # Cursor/offset pagination
```

---

## ⚡ Quick Start

```bash
# 1. Clone & install
git clone <repo-url>
cd shalabi-market-api
npm ci   # reproducible install (preferred)
# or: npm install

> This repo includes a synchronized `package-lock.json` (CI-ready).

# 2. Environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 3. Database
npx prisma generate
npx prisma db push   # or: npx prisma migrate dev

# 4. Run
npm run dev          # development (nodemon + debug logs)
npm start            # production
```

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

| Role | Description |
|---|---|
| `Customer` | Registered user — full shopping access |
| `Admin` | Full platform management |
| `Guest` | Temporary session — browse & cart only |

---

## 🛡️ Security Features

| Feature | Implementation |
|---|---|
| Security Headers | `helmet` — X-Frame-Options, HSTS, XSS filter, etc. |
| Rate Limiting | Login: 10/15min (failures only) · Register: 10/hr prod (20/hr dev) · `/api/*`: 300/15min |
| Guest Limit | 5 guest sessions/hr per IP |
| CORS | Configurable whitelist via `ALLOWED_ORIGINS` env |
| SQL Injection | Prisma parameterized queries |
| Body Size Limit | 100 KB JSON/urlencoded limit (balanced for frontend payloads) |
| Password Hashing | bcrypt with salt rounds = 10 |

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Private |
| POST | `/api/auth/guest` | Public |
| GET | `/api/auth/me` | Private |

### Products
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/admin/products` | Admin |
| PUT | `/api/admin/products/:id` | Admin |
| DELETE | `/api/admin/products/:id` | Admin |

### Cart
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/cart` | Auth |
| POST | `/api/cart/items` | Auth |
| PUT | `/api/cart/items/:id` | Auth |
| DELETE | `/api/cart/items/:id` | Auth |

### Orders
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/orders` | Customer |
| POST | `/api/orders` | Customer |
| GET | `/api/orders/:id` | Customer |
| PUT | `/api/orders/:id/cancel` | Customer |

---

## ✅ Response Format

Every endpoint returns:
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { } | null
}
```

Validation errors return:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      { "field": "phone_number", "message": "Phone number is required" }
    ]
  }
}
```

---

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode
```

Test files: `__tests__/*.test.js`

Current coverage: Auth module (register · login · me · security headers · 404)

---

## 📊 Logging

| Environment | Output |
|---|---|
| Development | Colorized console (debug level) |
| Production | Console + `logs/combined.log` + `logs/error.log` |

Log levels: `error › warn › info › http › debug`

---

## 🚀 Production Deployment

```bash
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://yourdomain.com
```

```bash
npm start
```

Recommended: Use PM2 or Docker for process management.

---

## 🗄️ Database Migrations

The `migrations/` folder contains **manual SQL migrations** that must be applied to your database before deployment. These are constraints and schema changes not managed by Prisma automatically.

Run them in order:

```bash
# Migration 001 — Add 'cancellation' to stock_reason_check constraint
psql $DATABASE_URL -f migrations/001_add_cancellation_reason.sql

# Migration 002 — Make guests.phone_number nullable
#   Guests browse without a phone number; contact info is collected via shipping_phone at order time
psql $DATABASE_URL -f migrations/002_guests_phone_nullable.sql
```

> ⚠️ **These migrations MUST be run before starting the server on any new or existing database.**
> Skipping `001` will cause order cancellations to fail.
> Skipping `002` will cause guest sessions created without a phone number to fail.

---

## 📝 License

MIT
