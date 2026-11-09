// Rate limiting: caps how many requests one IP address can make in a time window.
// - Auth limiters (signup, login): strict, to slow down password guessing and spam accounts.
// - API limiter (everything under /api): looser, to protect the server from floods.
// Limits come from env vars so they can be tuned without code changes.
//
// Note: counts are kept in memory. On Vercel each serverless instance has its own
// memory, so there the limit is "per instance", not truly global.
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function createLimiter({ name, max, windowMin, message }) {
  return rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit: max,
    // Send the standard "RateLimit" header so clients can see how many requests they have left.
    standardHeaders: 'draft-8',
    legacyHeaders: false, // skip the old X-RateLimit-* headers
    // Instead of the library's default text reply, log the hit and pass a 429 AppError
    // to our error handler so the response uses the standard JSON error shape.
    // (The library has already set the Retry-After header by this point.)
    handler: (req, res, next) => {
      logger.warn('Rate limit exceeded', { limiter: name, ip: req.ip, method: req.method, path: req.originalUrl });
      next(new AppError(message, 429));
    },
  });
}

const { authMax, authWindowMin, apiMax, apiWindowMin } = config.rateLimit;
const authMessage = `Too many attempts, please try again after ${authWindowMin} minutes`;

// Separate counters for signup and login, so creating an account doesn't use up login attempts.
const signupLimiter = createLimiter({ name: 'signup', max: authMax, windowMin: authWindowMin, message: authMessage });
const loginLimiter = createLimiter({ name: 'login', max: authMax, windowMin: authWindowMin, message: authMessage });

const apiLimiter = createLimiter({
  name: 'api',
  max: apiMax,
  windowMin: apiWindowMin,
  message: `Too many requests, please try again after ${apiWindowMin} minutes`,
});

module.exports = { signupLimiter, loginLimiter, apiLimiter };
