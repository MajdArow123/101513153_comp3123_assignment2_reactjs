// Health check: a quick way (for us, Postman, or a monitoring tool) to see
// that the API is running and whether it can reach the database.
const express = require('express');
const config = require('../config/env');
const { connectDB, getDbState } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  // On Vercel a fresh instance has not connected yet, so try (or reuse the cached
  // connection) before reporting. If it fails we still answer, showing the real state.
  try {
    await connectDB();
  } catch {
    // ignored on purpose: the "database" field below reports the problem
  }
  const database = getDbState();

  res.status(200).json({
    // "degraded" tells us the API is up but MongoDB is not connected.
    status: database === 'connected' ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()), // seconds since this process started
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database,
  });
});

module.exports = router;
