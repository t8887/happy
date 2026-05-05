const User = require('../models/User');
const createError = require('../utils/createError');
const { sendSuccess } = require('../utils/response');

// GET /api/profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select(
    'username name bio avatar xp totalXP streak createdAt'
  );
  if (!user) throw createError('User not found', 404);
  sendSuccess(res, { user });
};

// PATCH /api/profile/update
const updateProfile = async (req, res) => {
  const { name, bio, avatar } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (bio !== undefined) updates.bio = bio.trim();
  if (avatar !== undefined) {
    // Accept base64 image data URIs or plain URLs
    const val = String(avatar).trim();
    // Reject suspiciously large payloads (> 200KB base64 ≈ ~150KB image)
    if (val.length > 204800) throw createError('Avatar image is too large (max ~150KB)', 400);
    updates.avatar = val;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('username name bio avatar xp totalXP streak');

  if (!user) throw createError('User not found', 404);
  sendSuccess(res, { user });
};

module.exports = { getProfile, updateProfile };
