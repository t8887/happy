/**
 * Standardized success response helper.
 * All success responses will have shape: { success: true, ...data }
 *
 * @param {object} res - Express response object
 * @param {object} data - Data to merge into the response body
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, ...data });
};

/**
 * Standardized error response helper.
 * Prefer throwing errors and letting errorHandler handle them —
 * use this only for explicit inline error responses.
 *
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 */
const sendError = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
