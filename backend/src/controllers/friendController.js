const Friend = require('../models/Friend');
const User = require('../models/User');

// POST /friends/request  { receiverId }
const sendRequest = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId } = req.body;

  if (!receiverId) return res.status(400).json({ success: false, message: 'receiverId is required' });
  if (senderId === receiverId) return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });

  const receiver = await User.findById(receiverId);
  if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

  // Check if any friendship already exists in either direction
  const existing = await Friend.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existing) {
    return res.status(409).json({ success: false, message: `Friend request already ${existing.status}` });
  }

  const friendship = await Friend.create({ sender: senderId, receiver: receiverId });
  res.status(201).json({ success: true, data: friendship });
};

// POST /friends/accept  { friendshipId }
const acceptRequest = async (req, res) => {
  const { friendshipId } = req.body;
  if (!friendshipId) return res.status(400).json({ success: false, message: 'friendshipId is required' });

  const friendship = await Friend.findOne({ _id: friendshipId, receiver: req.user.id, status: 'pending' });
  if (!friendship) return res.status(404).json({ success: false, message: 'Friend request not found' });

  friendship.status = 'accepted';
  await friendship.save();
  res.json({ success: true, data: friendship });
};

// POST /friends/decline  { friendshipId }
const declineRequest = async (req, res) => {
  const { friendshipId } = req.body;
  if (!friendshipId) return res.status(400).json({ success: false, message: 'friendshipId is required' });

  const friendship = await Friend.findOne({ _id: friendshipId, receiver: req.user.id, status: 'pending' });
  if (!friendship) return res.status(404).json({ success: false, message: 'Friend request not found' });

  friendship.status = 'declined';
  await friendship.save();
  res.json({ success: true, data: friendship });
};

// GET /friends/list
const getFriendList = async (req, res) => {
  const userId = req.user.id;

  const friendships = await Friend.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: 'accepted',
  })
    .populate('sender', 'username name avatar')
    .populate('receiver', 'username name avatar');

  // Return the "other" user in each friendship
  const friends = friendships.map((f) => {
    const isSender = f.sender._id.toString() === userId;
    return {
      friendshipId: f._id,
      user: isSender ? f.receiver : f.sender,
      since: f.updatedAt,
    };
  });

  res.json({ success: true, data: friends });
};

// GET /friends/requests
const getFriendRequests = async (req, res) => {
  const requests = await Friend.find({ receiver: req.user.id, status: 'pending' })
    .populate('sender', 'username name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
};

module.exports = { sendRequest, acceptRequest, declineRequest, getFriendList, getFriendRequests };
