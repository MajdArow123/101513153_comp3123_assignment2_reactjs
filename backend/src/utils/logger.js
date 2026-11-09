// Central application logger (winston).
// - Locally: JSON logs go to logs/app.log (everything) and logs/error.log (errors only), plus the console.
// - On Vercel: console only, because the serverless filesystem is read-only.
// Sensitive values are redacted before anything is written.
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const config = require('../config/env');

// Any field whose name matches this is replaced with "[REDACTED]", at any nesting depth.
const SENSITIVE_KEY = /pass(word)?|token|jwt|secret|authorization|cookie|mongodb_?uri/i;

// Patterns that could appear inside plain strings (e.g. an error message).
const SENSITIVE_PATTERNS = [
  [/mongodb(\+srv)?:\/\/[^\s"']+/gi, 'mongodb://[REDACTED]'],
  [/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]'],
  // A JWT is three base64url parts separated by dots, starting with "eyJ".
  [/eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, '[REDACTED_JWT]'],
];

function redactString(str) {
  return SENSITIVE_PATTERNS.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), str);
}

function redact(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) return value; // guard against deep/circular objects
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(val, depth + 1);
    }
    return out;
  }
  return value;
}

// Custom winston format that runs redaction on every log entry.
const redactFormat = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'timestamp') continue;
    info[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(info[key]);
  }
  return info;
});

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // keep stack traces in logs (logs are private, responses are not)
  redactFormat()
);

const transports = [
  new winston.transports.Console({
    // Human-friendly colours in development; plain JSON elsewhere (Vercel reads JSON well).
    format:
      config.nodeEnv === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : winston.format.json(),
  }),
];

if (!config.isVercel) {
  const logDir = path.join(__dirname, '..', '..', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'app.log'), format: winston.format.json() }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.json(),
    })
  );
}

const logger = winston.createLogger({
  // "http" sits between info and verbose, so request logs are included by default.
  level: process.env.LOG_LEVEL || 'http',
  format: baseFormat,
  defaultMeta: { service: 'comp3123-assignment1' },
  transports,
});

module.exports = logger;
