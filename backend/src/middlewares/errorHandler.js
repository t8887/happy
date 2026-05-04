const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose: field-level validation errors (e.g. password too short)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose: invalid ObjectId (e.g. /tasks/not-an-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB: duplicate key (e.g. email or username already exists)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`;
  }

  // JWT: malformed or tampered token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token, please login again';
  }

  // JWT: valid token but expired
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please login again';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${statusCode}] ${message}\n`, err.stack);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;

