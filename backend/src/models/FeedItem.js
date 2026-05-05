const mongoose = require('mongoose');

const TASK_TYPES = ['task', 'habit', 'workout', 'reading', 'meditation', 'other'];

/**
 * FeedItem — a dedicated document created whenever a task is completed.
 * Keeps the feed independent from the Task collection so tasks can be
 * deleted without losing feed history.
 */
const feedItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: TASK_TYPES,
      default: 'task',
    },
    xpAwarded: {
      type: Number,
      required: true,
      default: 0,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    taskImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index for fast per-user feed queries sorted by newest first
feedItemSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('FeedItem', feedItemSchema);
