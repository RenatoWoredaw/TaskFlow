const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');

router.use(protect);
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
