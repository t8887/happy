const Task = require('../models/Task');
const FeedItem = require('../models/FeedItem');
const { awardXP } = require('../services/xpService');
const { resetRepeatTasks } = require('../services/resetService');
const createError = require('../utils/createError');
const { sendSuccess } = require('../utils/response');

// GET /api/tasks — returns only pending tasks (after lazily resetting repeating ones)
const getTasks = async (req, res) => {
  await resetRepeatTasks(req.user._id);
  const tasks = await Task.find({ user: req.user._id, status: 'pending' }).sort({ createdAt: -1 });
  sendSuccess(res, { tasks });
};

// GET /api/tasks/completed
const getCompletedTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id, status: 'completed' }).sort({ completedAt: -1 });
  sendSuccess(res, { tasks });
};

// POST /api/tasks
const createTask = async (req, res) => {
  const title = req.body.title?.trim();
  const { type, repeatType, scheduledTime, image } = req.body;

  if (!title) throw createError('Title is required', 400);

  if (image && Buffer.byteLength(image, 'utf8') > 300 * 1024) {
    throw createError('Image too large (max 300 KB)', 400);
  }

  const task = await Task.create({
    user: req.user._id,
    title,
    type: type || 'task',
    repeatType: repeatType || 'none',
    scheduledTime: scheduledTime || null,
    image: image || '',
  });

  sendSuccess(res, { task }, 201);
};

// PATCH /api/tasks/:id/complete
const completeTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

  if (!task) throw createError('Task not found', 404);
  if (task.isCompleted) throw createError('Task is already completed', 400);

  const xpAwarded = await awardXP(req.user._id);

  const completedAt = new Date();
  task.isCompleted = true;
  task.status = 'completed';
  task.completedAt = completedAt;
  task.xpAwarded = xpAwarded;
  await task.save();

  await FeedItem.create({
    user: req.user._id,
    task: task._id,
    title: task.title,
    type: task.type,
    xpAwarded,
    completedAt,
    taskImage: task.image || '',
  });

  sendSuccess(res, { task, xpAwarded });
};

// PATCH /api/tasks/:id — edit a pending task
const updateTask = async (req, res) => {
  const { title, type, repeatType, scheduledTime, image } = req.body;

  const task = await Task.findOne({ _id: req.params.id, user: req.user._id, status: 'pending' });
  if (!task) throw createError('Task not found', 404);

  if (title !== undefined) {
    const trimmed = title.trim();
    if (!trimmed) throw createError('Title cannot be empty', 400);
    task.title = trimmed;
  }
  if (type !== undefined) task.type = type;
  if (repeatType !== undefined) task.repeatType = repeatType;
  if (scheduledTime !== undefined) task.scheduledTime = scheduledTime || null;
  if (image !== undefined) {
    if (image && Buffer.byteLength(image, 'utf8') > 300 * 1024) {
      throw createError('Image too large (max 300 KB)', 400);
    }
    task.image = image;
  }

  await task.save();
  sendSuccess(res, { task });
};

// DELETE /api/tasks/:id — soft delete
const deleteTask = async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: { $ne: 'deleted' } },
    { $set: { status: 'deleted' } },
    { new: true }
  );

  if (!task) throw createError('Task not found', 404);

  sendSuccess(res, { message: 'Task deleted' });
};

module.exports = { getTasks, getCompletedTasks, createTask, completeTask, updateTask, deleteTask };
