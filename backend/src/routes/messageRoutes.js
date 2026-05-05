const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { sendMessage, getConversation, getConversationList } = require('../controllers/messageController');

router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversationList);
router.get('/:userId', protect, getConversation);

module.exports = router;
