const express = require('express');
const { protect } = require('../middleware/auth');
const { getTeams, createTeam, getMembers, inviteMember, removeMember } = require('../controllers/teamController');

const router = express.Router();
router.use(protect);

router.get('/',                         getTeams);
router.post('/',                        createTeam);
router.get('/:teamId/members',          getMembers);
router.post('/:teamId/members',         inviteMember);
router.delete('/:teamId/members/:userId', removeMember);

module.exports = router;
