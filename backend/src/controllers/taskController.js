const Task = require('../models/Task');
const FeedItem = require('../models/FeedItem');
const { awardXP } = require('../services/xpService');
const createError = require('../utils/createError');
const { sendSuccess } = require('../utils/response');

// GET /api/tasks
const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, { tasks });
};

// POST /api/tasks
const createTask = async (req, res) => {
  const title = req.body.title?.trim();
  const { type } = req.body;

  if (!title) throw createError('Title is required', 400);

  const task = await Task.create({
    user: req.user._id,
    title,
    type: type || 'task',
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
  });

  sendSuccess(res, { task, xpAwarded });
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!task) throw createError('Task not found', 404);

  sendSuccess(res, { message: 'Task deleted' });
};

module.exports = { getTasks, createTask, completeTask, deleteTask };
