// Builds and configures the Express app.
// It does NOT call listen(): server.js (local) and api/index.js (Vercel)
// each start it in their own way, so the app itself stays reusable.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiters');
const ensureDb = require('./middleware/ensureDb');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();

// On Vercel, requests arrive through Vercel's proxy, so the real client IP is in the
// X-Forwarded-For header. Trusting exactly one proxy hop lets req.ip (used by the rate
// limiter) be the real client. Locally there is no proxy, so we don't trust that header,
// otherwise a client could fake it to dodge the rate limit.
if (config.isVercel) {
  app.set('trust proxy', 1);
}

// Log requests first so even requests that fail later (bad JSON, 429...) are recorded.
app.use(requestLogger);

// helmet sets security-related HTTP headers on every response, e.g.:
// - removes X-Powered-By (don't advertise Express)
// - X-Content-Type-Options: nosniff (browser must respect our Content-Type)
// - Strict-Transport-Security (browsers must use HTTPS)
// - Content-Security-Policy, X-Frame-Options (block script injection / clickjacking)
app.use(helmet());

app.use(cors());

// Parse JSON bodies; the size limit protects against very large payloads.
app.use(express.json({ limit: '10kb' }));

// ---- Routes ----
app.use('/health', healthRoutes);

// Everything under /api: general rate limit first (signup/login also have stricter limits),
// then make sure the database is connected. The limiter goes first so blocked requests
// never cost a database connection.
app.use('/api', apiLimiter, ensureDb);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

// ---- Fallbacks (must be last) ----
app.use(notFound); // no route matched -> 404
app.use(errorHandler); // any error -> standard JSON error response

module.exports = app;
