// Makes sure MongoDB is connected before an API request reaches a controller.
// If the database went down after startup, we answer 503 straight away instead of
// letting the request hang until Mongoose times out.
const { isDbConnected } = require('../config/db');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function ensureDb(req, res, next) {
  if (isDbConnected()) return next();

  logger.error('Request rejected: database is not connected', { method: req.method, path: req.originalUrl });
  // 503 = temporary problem on our side; the client can retry later.
  next(new AppError('Service temporarily unavailable: database connection failed', 503));
}

module.exports = ensureDb;
