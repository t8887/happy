/**
 * Creates a standardized error with an HTTP statusCode attached.
 * Use this instead of the 3-line new Error() + statusCode pattern.
 *
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = createError;
