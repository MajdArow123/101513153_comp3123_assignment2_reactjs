// Central error handler: every error in the app ends up here and is converted
// into ONE consistent JSON shape: { status: false, message, errors? }.
// Express recognises it as an error handler because it has 4 parameters.
const config = require('../config/env');
const logger = require('../utils/logger');

// Translate known error types into a status code + safe client message.
function normalizeError(err) {
  // Our own expected errors (validation, not found, forbidden...).
  if (err.isOperational) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  // express.json() could not parse the request body.
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Malformed JSON in request body' };
  }

  // Body larger than the limit set in app.js.
  if (err.type === 'entity.too.large') {
    return { statusCode: 413, message: 'Request body is too large' };
  }

  // Mongoose could not convert a value (e.g. an invalid ObjectId).
  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid value for field '${err.path}'` };
  }

  // Mongoose schema validation failed.
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return { statusCode: 400, message: 'Validation failed', errors };
  }

  // MongoDB unique index violation (duplicate username / email).
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    const errors = fields.map((field) => ({ field, message: `${field} is already in use` }));
    return { statusCode: 409, message: 'Duplicate value: resource already exists', errors };
  }

  // JWT errors (normally handled by the auth middleware, kept here as a safety net).
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token has expired, please log in again' };
  }
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }

  // Anything else is an unexpected bug: hide the details from the client.
  return { statusCode: 500, message: 'Internal server error' };
}

// eslint-disable-next-line no-unused-vars -- Express needs all 4 args to treat this as an error handler
function errorHandler(err, req, res, next) {
  const { statusCode, message, errors } = normalizeError(err);

  const logMeta = { method: req.method, path: req.originalUrl, statusCode };
  if (statusCode >= 500) {
    // Full error (with stack) goes to the private log file, never to the client.
    logger.error(err.message, { ...logMeta, stack: err.stack });
  } else {
    logger.warn(message, { ...logMeta, errors });
  }

  const body = { status: false, message };
  if (errors && errors.length > 0) body.errors = errors;

  // Helpful for debugging locally; never sent in production.
  if (!config.isProduction && statusCode >= 500) {
    body.debug = { error: err.message, stack: err.stack };
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
