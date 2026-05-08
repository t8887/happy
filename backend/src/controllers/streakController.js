const User = require('../models/User');
const { sendSuccess } = require('../utils/response');

// GET /api/streak
const getStreak = async (req, res) => {
  const user = await User.findById(req.user._id).select('streak longestStreak lastActiveDate xp');
  sendSuccess(res, {
    streak: { current: user.streak, longest: user.longestStreak, lastActiveDate: user.lastActiveDate, xp: user.xp },
  });
};

// PATCH /api/streak/update
const updateStreak = async (req, res) => {
  const user = await User.findById(req.user._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  let newStreak = user.streak;
  if (lastActive) {
    const diffDays = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) newStreak = 0;
  }

  await User.findByIdAndUpdate(req.user._id, { streak: newStreak });

  sendSuccess(res, { streak: { current: newStreak, longest: user.longestStreak, lastActiveDate: user.lastActiveDate } });
};

module.exports = { getStreak, updateStreak };
