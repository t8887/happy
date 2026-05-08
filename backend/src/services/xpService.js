const User = require('../models/User');

const XP_PER_TASK = 10;

/**
 * Awards XP to a user and updates their streak.
 * Streak increments if the user completed a task today and
 * their last active date was yesterday (or this is their first task).
 */
const awardXP = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  let newStreak = user.streak;

  if (!lastActive) {
    // First ever task
    newStreak = 1;
  } else {
    const diffDays = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      // Consecutive day
      newStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      newStreak = 1;
    }
    // diffDays === 0 means same day — keep streak as-is
  }

  await User.findByIdAndUpdate(userId, {
    $inc: { xp: XP_PER_TASK },
    streak: newStreak,
    longestStreak: newStreak > (user.longestStreak ?? 0) ? newStreak : user.longestStreak,
    lastActiveDate: today,
  });

  return XP_PER_TASK;
};

module.exports = { awardXP, XP_PER_TASK };
