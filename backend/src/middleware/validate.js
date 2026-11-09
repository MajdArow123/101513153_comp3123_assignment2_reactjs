// Runs after the express-validator rules for a route.
// If any rule failed, it stops the request with a 400 and a list of field errors.
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Turn express-validator's error objects into our simple { field, message } format.
// We deliberately drop the submitted "value" so passwords never end up in responses or logs.
function formatErrors(rawErrors) {
  return rawErrors.flatMap((err) => {
    // checkExact() reports all unknown fields in one error; split it into one entry per field.
    if (err.type === 'unknown_fields') {
      return err.fields.map((f) => ({ field: f.path, message: `Unknown field '${f.path}' is not allowed` }));
    }
    return [{ field: err.path || 'body', message: err.msg }];
  });
}

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  // onlyFirstError: one message per field is easier to read than five.
  const errors = formatErrors(result.array({ onlyFirstError: true }));

  logger.warn('Validation failed', {
    method: req.method,
    path: req.originalUrl,
    fields: errors.map((e) => e.field), // field names only, never values
  });

  next(new AppError('Validation failed', 400, errors));
}

module.exports = validate;
