const mongoose = require('mongoose');

const TASK_TYPES = ['task', 'habit', 'workout', 'reading', 'meditation', 'other'];
const TASK_STATUSES = ['pending', 'completed', 'deleted'];
const REPEAT_TYPES = ['none', 'daily', 'weekly', 'one-time'];

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: TASK_TYPES,
      default: 'task',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending',
    },
    repeatType: {
      type: String,
      enum: REPEAT_TYPES,
      default: 'none',
    },
    scheduledTime: {
      // "HH:MM" format e.g. "09:00" — used for local notification scheduling
      type: String,
      default: null,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'scheduledTime must be in HH:MM format'],
    },
    lastResetDate: {
      // Tracks when a repeating task was last reset (used by reset logic)
      type: Date,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
