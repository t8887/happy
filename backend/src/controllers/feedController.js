const FeedItem = require('../models/FeedItem');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response');

// GET /api/feed
const getFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [feedItems, total, user] = await Promise.all([
    FeedItem.find({ user: req.user._id })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title type completedAt xpAwarded task'),
    FeedItem.countDocuments({ user: req.user._id }),
    User.findById(req.user._id).select('xp streak lastActiveDate username'),
  ]);

  sendSuccess(res, {
    summary: {
      xp: user.xp,
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
      username: user.username,
    },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    feed: feedItems,
  });
};

module.exports = { getFeed };
