// Makes sure MongoDB is connected before an API request reaches a controller.
// Locally, server.js already connected at startup, so this returns immediately.
// On Vercel there is no startup step, so the first request in a new instance connects
// here (and later requests reuse the cached connection from db.js).
const { connectDB } = require('../config/db');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

async function ensureDb(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    // 503 = temporary problem on our side; the client can retry later.
    next(new AppError('Service temporarily unavailable: database connection failed', 503));
  }
}

module.exports = ensureDb;
