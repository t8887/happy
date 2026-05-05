const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateToken } = require('../services/tokenService');
const createError = require('../utils/createError');
const { sendSuccess } = require('../utils/response');
const { sendOtpEmail } = require('../services/emailService');

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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) throw createError('Please provide your email', 400);

  const user = await User.findOne({ email });
  // Always return 200 to avoid email enumeration
  if (!user) {
    sendSuccess(res, { message: 'If that email exists, a code has been sent.' });
    return;
  }

  // Fixed OTP for testing — change to random in production
  const code = '111111';
  const codeHash = await bcrypt.hash(code, 10);

  // Upsert: one OTP record per email
  await Otp.findOneAndDelete({ email });
  await Otp.create({
    email,
    codeHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  await sendOtpEmail(email, code);

  sendSuccess(res, { message: 'If that email exists, a code has been sent.' });
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { code } = req.body;
  if (!email || !code) throw createError('Email and code are required', 400);

  const record = await Otp.findOne({ email });
  if (!record) throw createError('Code not found or expired', 400);

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw createError('Code has expired', 400);
  }

  const match = await bcrypt.compare(String(code), record.codeHash);
  if (!match) throw createError('Invalid code', 400);

  // Issue a short-lived reset token (signed but not a full auth JWT)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Reuse the OTP record to store the reset token hash (swap fields)
  record.codeHash = resetTokenHash;
  record.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min to reset
  await record.save();

  sendSuccess(res, { resetToken });
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    throw createError('email, resetToken and newPassword are required', 400);
  }
  if (newPassword.length < 6) throw createError('Password must be at least 6 characters', 400);

  const record = await Otp.findOne({ email });
  if (!record) throw createError('Reset session not found or expired', 400);

  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw createError('Reset session has expired', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  if (tokenHash !== record.codeHash) throw createError('Invalid reset token', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw createError('User not found', 404);

  user.password = newPassword; // pre-save hook will hash it
  await user.save();
  await record.deleteOne();

  sendSuccess(res, { message: 'Password reset successfully.' });
};

module.exports = { register, login, getMe, forgotPassword, verifyOtp, resetPassword };
