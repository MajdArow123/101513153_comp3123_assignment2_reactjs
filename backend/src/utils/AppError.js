// A custom error type for "expected" failures (bad input, not found, forbidden...).
// Throwing an AppError lets any layer say "respond with this status and message",
// and the central error handler turns it into the standard JSON error shape.
class AppError extends Error {
  /**
   * @param {string} message    Safe message that can be shown to the client
   * @param {number} statusCode HTTP status code (e.g. 400, 404)
   * @param {Array}  [errors]   Optional list of field-level errors
   */
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    // Marks this as a known, handled error (vs. an unexpected bug).
    this.isOperational = true;
  }
}

module.exports = AppError;
