// MongoDB connection using Mongoose.
//
// Why the cache? On Vercel each request may run in a "warm" serverless instance that
// already connected earlier, or in a brand-new "cold" one. Opening a new connection on
// every request would be slow and could exhaust Atlas's connection limit. So we store the
// connection promise on `global` (which survives between requests in the same instance)
// and reuse it. Locally this simply means "connect once".
const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// Mongoose readyState numbers -> readable names (used by the /health endpoint).
const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

// Reuse the cache if this instance already created one.
const cache = global._mongooseCache || (global._mongooseCache = { promise: null });

mongoose.set('strictQuery', true);

async function connectDB() {
  // Already connected: nothing to do.
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  // Start connecting only once. Concurrent requests all await the same promise
  // instead of each opening their own connection.
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(config.mongodbUri, {
        dbName: config.dbName, // forces the required database name even if the URI names another
        serverSelectionTimeoutMS: 5000, // fail fast (5s) instead of hanging if Atlas is unreachable
      })
      .then((m) => {
        // Log only the DB name and host, never the full URI (it contains the password).
        logger.info('MongoDB connected', { database: config.dbName, host: m.connection.host });
        return m.connection;
      })
      .catch((err) => {
        // Clear the cache so the next request tries again instead of reusing a failed promise.
        cache.promise = null;
        throw err;
      });
  }

  return cache.promise;
}

function getDbState() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDB, getDbState };
