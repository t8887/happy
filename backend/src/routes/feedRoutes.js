const express = require('express');
const router = express.Router();
const { getFeed } = require('../controllers/feedController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getFeed);

module.exports = router;
