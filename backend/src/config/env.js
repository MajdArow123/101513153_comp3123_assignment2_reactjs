// Loads environment variables once and validates them.
// Every other file reads settings from here instead of process.env directly,
// so there is one place that knows what the app needs to run.
const path = require('path');
require('dotenv').config({ quiet: true });

// The app cannot work safely without these, so we refuse to start if any is missing.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN'];

const missing = REQUIRED.filter((name) => !process.env[name] || !process.env[name].trim());
if (missing.length > 0) {
  // Fail fast: a clear crash at startup is better than confusing errors later.
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
}

// Reads a positive integer from env, falling back to a default if it is unset or invalid.
function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

// CORS_ORIGIN may be one origin or a comma-separated list,
// e.g. "http://localhost:3000,http://127.0.0.1:3000".
const corsOrigins = process.env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// A wildcard would let ANY website call our API from a user's browser, so we refuse it.
if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
  throw new Error('CORS_ORIGIN must list explicit origins (a wildcard "*" is not allowed)');
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: toPositiveInt(process.env.PORT, 5000),

  mongodbUri: process.env.MONGODB_URI,
  // The assignment requires this exact database name, so it is also the default.
  dbName: (process.env.DB_NAME || '').trim() || 'comp3123_assignment2',

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

  // Only these browser origins (our React app) may call the API.
  corsOrigins,

  // Profile pictures are saved here on disk and served at /uploads.
  // An absolute path, so it works no matter which folder the server is started from.
  uploadsDir: path.join(__dirname, '..', '..', 'uploads'),
  uploadMaxMb: toPositiveInt(process.env.UPLOAD_MAX_MB, 2),

  rateLimit: {
    authMax: toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 5),
    authWindowMin: toPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 15),
    apiMax: toPositiveInt(process.env.API_RATE_LIMIT_MAX, 100),
    apiWindowMin: toPositiveInt(process.env.API_RATE_LIMIT_WINDOW_MIN, 15),
  },
};

// Object.freeze stops any code from accidentally changing config at runtime.
// (freeze is shallow, so we also freeze the nested array and object.)
Object.freeze(config.corsOrigins);
Object.freeze(config.rateLimit);
module.exports = Object.freeze(config);
