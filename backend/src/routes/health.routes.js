// Health check: a quick way (for us, Postman, or the Docker health check) to see
// that the API is running and whether it can reach the database.
const express = require('express');
const config = require('../config/env');
const { getDbState } = require('../config/db');

const router = express.Router();

router.get('/', (req, res) => {
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
