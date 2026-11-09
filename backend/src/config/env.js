// Loads environment variables once and validates them.
// Every other file reads settings from here instead of process.env directly,
// so there is one place that knows what the app needs to run.
require('dotenv').config({ quiet: true });

// The app cannot work safely without these, so we refuse to start if any is missing.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

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

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  // Vercel sets VERCEL=1 automatically; we use it to disable file logging there.
  isVercel: Boolean(process.env.VERCEL),
  port: toPositiveInt(process.env.PORT, 3000),

  mongodbUri: process.env.MONGODB_URI,
  // The assignment requires this exact database name.
  dbName: 'comp3123_assignment1',

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

  rateLimit: {
    authMax: toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 5),
    authWindowMin: toPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 15),
    apiMax: toPositiveInt(process.env.API_RATE_LIMIT_MAX, 100),
    apiWindowMin: toPositiveInt(process.env.API_RATE_LIMIT_WINDOW_MIN, 15),
  },
};

// Object.freeze stops any code from accidentally changing config at runtime.
module.exports = Object.freeze(config);
