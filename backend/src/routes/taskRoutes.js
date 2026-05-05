const express = require('express');
const router = express.Router();
const { getTasks, getCompletedTasks, createTask, completeTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

// All task routes require authentication
router.use(protect);

router.get('/', getTasks);
router.get('/completed', getCompletedTasks);
router.post('/', createTask);
router.patch('/:id/complete', completeTask);
router.delete('/:id', deleteTask);

module.exports = router;
