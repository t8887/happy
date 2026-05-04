const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getStreak, updateStreak } = require('../controllers/streakController');

router.get('/', protect, getStreak);
router.patch('/update', protect, updateStreak);

module.exports = router;
