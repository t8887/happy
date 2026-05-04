const User = require('../models/User');
const { generateToken } = require('../services/tokenService');
const createError = require('../utils/createError');
const { sendSuccess } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!username || !email || !password) {
    throw createError('Please provide username, email and password', 400);
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    throw createError('User with that email or username already exists', 409);
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id, user.username);

  sendSuccess(res, {
    token,
    user: { id: user._id, username: user.username, email: user.email, xp: user.xp, streak: user.streak },
  }, 201);
};

// POST /api/auth/login
const login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    throw createError('Please provide email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw createError('Invalid email or password', 401);
  }

  const token = generateToken(user._id, user.username);

  sendSuccess(res, {
    token,
    user: { id: user._id, username: user.username, email: user.email, xp: user.xp, streak: user.streak },
  });
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  const user = req.user;
  sendSuccess(res, {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      xp: user.xp,
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
    },
  });
};

module.exports = { register, login, getMe };
