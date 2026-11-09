// Builds and configures the Express app.
// It does NOT call listen(): server.js does that after connecting to MongoDB,
// so the app itself stays easy to reuse (e.g. in tests).
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/env');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiters');
const ensureDb = require('./middleware/ensureDb');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();

// Log requests first so even requests that fail later (bad JSON, 429...) are recorded.
app.use(requestLogger);

// helmet sets security-related HTTP headers on every response, e.g.:
// - removes X-Powered-By (don't advertise Express)
// - X-Content-Type-Options: nosniff (browser must respect our Content-Type, so an
//   uploaded file can never be run as a script)
// - Strict-Transport-Security (browsers must use HTTPS)
// - Content-Security-Policy, X-Frame-Options (block script injection / clickjacking)
app.use(
  helmet({
    // By default helmet sends "Cross-Origin-Resource-Policy: same-origin", which makes the
    // browser refuse to show our images on any other origin. The React app runs on a
    // different origin (port 3000) than the API (port 5000), so profile pictures would be
    // blocked. "cross-origin" allows other sites to display our files; they are only
    // images, and every other protection (CORS for the API, nosniff...) stays in place.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS: browsers block a page from calling an API on a different origin unless the API
// says it is allowed. We allow ONLY the frontend origin(s) from CORS_ORIGIN, never "*".
const corsOptions = {
  origin(origin, callback) {
    // No Origin header = not a cross-origin browser request (curl, Postman, health checks).
    // CORS doesn't apply to those; authentication still protects the API.
    if (!origin) return callback(null, true);

    if (config.corsOrigins.includes(origin)) return callback(null, true);

    // Not on the list: answer without CORS headers, so the browser blocks the response.
    logger.warn('CORS request from a disallowed origin', { origin });
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Let the frontend read these headers, e.g. to show "try again in X minutes" after a 429.
  exposedHeaders: ['Retry-After', 'RateLimit', 'RateLimit-Policy'],
};
app.use(cors(corsOptions)); // also answers preflight (OPTIONS) requests

// Parse JSON bodies; the size limit protects against very large payloads.
app.use(express.json({ limit: '10kb' }));

// ---- Routes ----
app.use('/health', healthRoutes);

// Uploaded profile pictures, e.g. GET /uploads/3f2c...e1.webp
// Mounted outside /api so loading thumbnails doesn't use up the API rate limit.
// - dotfiles: 'deny'   -> never serve hidden files such as .gitkeep
// - index: false       -> never list or serve a folder index
// - redirect: false    -> don't redirect "/uploads" to "/uploads/"
// A missing file falls through to the JSON 404 handler below.
fs.mkdirSync(config.uploadsDir, { recursive: true });
app.use('/uploads', express.static(config.uploadsDir, { dotfiles: 'deny', index: false, redirect: false }));

// Everything under /api: general rate limit first (signup/login also have stricter limits),
// then make sure the database is connected. The limiter goes first so blocked requests
// are rejected as cheaply as possible.
app.use('/api', apiLimiter, ensureDb);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

// ---- Fallbacks (must be last) ----
app.use(notFound); // no route matched -> 404
app.use(errorHandler); // any error -> standard JSON error response

module.exports = app;
