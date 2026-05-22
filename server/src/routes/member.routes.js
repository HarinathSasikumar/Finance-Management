const express = require('express');
const router = express.Router();
const { getMembers, addMember, updateMember, deleteMember, getMemberRankings } = require('../controllers/member.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/groups/:groupId/members', protect, getMembers);
router.post('/groups/:groupId/members', protect, adminOnly, addMember);
router.put('/groups/:groupId/members/:memberId', protect, adminOnly, updateMember);
router.delete('/groups/:groupId/members/:memberId', protect, adminOnly, deleteMember);
router.get('/members/rankings', protect, getMemberRankings);

module.exports = router;
