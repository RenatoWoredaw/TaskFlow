const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask, getComments, addComment } = require('../controllers/taskController');

router.use(protect);
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.get('/:taskId/comments', getComments);
router.post('/:taskId/comments', addComment);

module.exports = router;
