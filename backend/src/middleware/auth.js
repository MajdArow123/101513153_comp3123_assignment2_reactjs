// Protects routes: only requests with a valid JWT in
// "Authorization: Bearer <token>" are allowed through.
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Log the failure reason (never the token itself) and stop with 401.
function reject(req, next, reason, message) {
  logger.warn('Authentication failed', { reason, method: req.method, path: req.originalUrl, ip: req.ip });
  next(new AppError(message, 401));
}

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return reject(req, next, 'missing_token', 'Authentication required: no token provided');
  }

  // Expect exactly "Bearer <token>".
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return reject(req, next, 'malformed_header', 'Invalid Authorization header: expected "Bearer <token>"');
  }

  let payload;
  try {
    // Pinning the algorithm stops attacks that try to change it (e.g. to "none").
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return reject(req, next, 'expired_token', 'Token has expired, please log in again');
    }
    return reject(req, next, 'invalid_token', 'Invalid token');
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    return reject(req, next, 'invalid_token_subject', 'Invalid token');
  }

  // The ONLY place the user's identity comes from. Controllers use req.user.id
  // and never trust a user id sent in the body, params, or query string.
  req.user = { id: payload.sub };
  next();
}

module.exports = auth;
