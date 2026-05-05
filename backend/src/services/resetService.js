const Task = require('../models/Task');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Lazily resets repeating tasks for a user when they fetch their task list.
 * - daily  → resets if completedAt was more than 24h ago
 * - weekly → resets if completedAt was more than 7 days ago
 * - one-time / none → never reset
 */
const resetRepeatTasks = async (userId) => {
  const now = new Date();

  const tasksToCheck = await Task.find({
    user: userId,
    status: 'completed',
    repeatType: { $in: ['daily', 'weekly'] },
  });

  if (tasksToCheck.length === 0) return;

  const resetIds = [];

  for (const task of tasksToCheck) {
    const reference = task.completedAt || task.lastResetDate;
    if (!reference) continue;

    const elapsed = now - new Date(reference);
    const threshold = task.repeatType === 'daily' ? MS_PER_DAY : 7 * MS_PER_DAY;

    if (elapsed >= threshold) {
      resetIds.push(task._id);
    }
  }

  if (resetIds.length > 0) {
    await Task.updateMany(
      { _id: { $in: resetIds } },
      {
        $set: {
          status: 'pending',
          isCompleted: false,
          completedAt: null,
          lastResetDate: now,
        },
      }
    );
  }
};

module.exports = { resetRepeatTasks };
