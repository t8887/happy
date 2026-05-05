const User = require('../models/User');
const Friend = require('../models/Friend');

// GET /users/search?q=
const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
  }

  const regex = new RegExp(q.trim(), 'i');

  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [{ username: regex }, { name: regex }],
  })
    .select('_id username name avatar')
    .limit(20);

  // Attach friendship status for each result
  const userIds = users.map((u) => u._id);
  const friendships = await Friend.find({
    $or: [
      { sender: req.user.id, receiver: { $in: userIds } },
      { receiver: req.user.id, sender: { $in: userIds } },
    ],
  });

  const friendMap = {};
  for (const f of friendships) {
    const otherId = f.sender.toString() === req.user.id ? f.receiver.toString() : f.sender.toString();
    friendMap[otherId] = { friendshipId: f._id, status: f.status };
  }

  const result = users.map((u) => ({
    ...u.toObject(),
    friendship: friendMap[u._id.toString()] || null,
  }));

  res.json({ success: true, data: result });
};

module.exports = { searchUsers };
