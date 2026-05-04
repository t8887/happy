const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('../utils/createError');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('Not authorized, no token', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded contains { id, username } — see tokenService
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(createError('User no longer exists', 401));
    }

    next();
  } catch (err) {
    // Pass JWT errors (JsonWebTokenError, TokenExpiredError) to errorHandler
    next(err);
  }
};

module.exports = { protect };
