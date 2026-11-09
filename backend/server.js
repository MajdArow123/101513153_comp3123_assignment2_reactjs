// Local entry point: connect to MongoDB first, then start listening.
// (On Vercel, api/index.js is used instead because there is no long-running server.)
const config = require('./src/config/env'); // validates env vars, throws if any are missing
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');

async function start() {
  try {
    // Connect before listening so we never accept requests we cannot serve.
    await connectDB();

    app.listen(config.port, () => {
      logger.info('Server started', { port: config.port, environment: config.nodeEnv });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

// Last-resort safety nets: log the problem, then exit so it can be restarted cleanly.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason instanceof Error ? reason.message : reason });
  process.exit(1);
});

start();
