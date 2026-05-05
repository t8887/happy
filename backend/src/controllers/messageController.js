const Message = require('../models/Message');
const User = require('../models/User');
const Friend = require('../models/Friend');

// POST /messages/send  { receiverId, content }
const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !content?.trim()) {
    return res.status(400).json({ success: false, message: 'receiverId and content are required' });
  }
  if (senderId === receiverId) {
    return res.status(400).json({ success: false, message: 'Cannot message yourself' });
  }

  // Only friends can message each other
  const friendship = await Friend.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
    status: 'accepted',
  });
  if (!friendship) {
    return res.status(403).json({ success: false, message: 'You must be friends to send messages' });
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content: content.trim(),
  });

  res.status(201).json({ success: true, data: message });
};

// GET /messages/:userId  — fetch conversation, mark incoming as read
const getConversation = async (req, res) => {
  const myId = req.user.id;
  const { userId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: myId, receiver: userId },
      { sender: userId, receiver: myId },
    ],
  }).sort({ createdAt: 1 });

  // Mark all unread messages sent TO me as read
  await Message.updateMany(
    { sender: userId, receiver: myId, read: false },
    { read: true }
  );

  res.json({ success: true, data: messages });
};

// GET /messages/conversations  — list of all people I've chatted with + last message
const getConversationList = async (req, res) => {
  const myId = req.user.id;

  // Get all messages involving me
  const messages = await Message.find({
    $or: [{ sender: myId }, { receiver: myId }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'username name avatar')
    .populate('receiver', 'username name avatar');

  // Build a map: otherUserId → { user, lastMessage, unread }
  const convMap = {};
  for (const msg of messages) {
    const other = msg.sender._id.toString() === myId ? msg.receiver : msg.sender;
    const otherId = other._id.toString();
    if (!convMap[otherId]) {
      convMap[otherId] = {
        user: other,
        lastMessage: msg.content,
        lastAt: msg.createdAt,
        unread: 0,
      };
    }
    if (!msg.read && msg.receiver._id.toString() === myId) {
      convMap[otherId].unread += 1;
    }
  }

  const conversations = Object.values(convMap).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  res.json({ success: true, data: conversations });
};

module.exports = { sendMessage, getConversation, getConversationList };
