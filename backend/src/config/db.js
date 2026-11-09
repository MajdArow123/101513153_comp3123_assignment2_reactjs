// MongoDB connection using Mongoose.
// server.js calls connectDB() once at startup. After that Mongoose keeps the connection
// open and reconnects by itself if MongoDB restarts, so we never connect per request.
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

mongoose.set('strictQuery', true);

async function connectDB() {
  const m = await mongoose.connect(config.mongodbUri, {
    dbName: config.dbName, // forces the required database name even if the URI names another
    serverSelectionTimeoutMS: 5000, // fail fast (5s) instead of hanging if MongoDB is unreachable
  });

  // Log only the DB name and host, never the full URI (it can contain a password).
  logger.info('MongoDB connected', { database: config.dbName, host: m.connection.host });
  return m.connection;
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function getDbState() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDB, isDbConnected, getDbState };
