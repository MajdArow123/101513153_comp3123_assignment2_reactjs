// Logs every HTTP request through winston using morgan.
// morgan measures the response time; winston decides where the log goes (file/console).
const morgan = require('morgan');
const logger = require('../utils/logger');

// Build a small JSON object per request. We deliberately pick only safe fields:
// no headers (Authorization would leak the JWT) and no body (would leak passwords).
const jsonFormat = (tokens, req, res) =>
  JSON.stringify({
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    status: Number(tokens.status(req, res)) || null,
    responseTimeMs: Number(tokens['response-time'](req, res)) || null,
    ip: req.ip,
  });

// Send morgan's output to winston, choosing the log level from the status code.
const stream = {
  write: (line) => {
    const entry = JSON.parse(line);
    const level = entry.status >= 500 ? 'error' : entry.status >= 400 ? 'warn' : 'http';
    logger.log(level, 'HTTP request', entry);
  },
};

module.exports = morgan(jsonFormat, { stream });
