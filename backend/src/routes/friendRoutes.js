const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  sendRequest,
  acceptRequest,
  declineRequest,
  getFriendList,
  getFriendRequests,
} = require('../controllers/friendController');

router.post('/request', protect, sendRequest);
router.post('/accept', protect, acceptRequest);
router.post('/decline', protect, declineRequest);
router.get('/list', protect, getFriendList);
router.get('/requests', protect, getFriendRequests);

module.exports = router;
