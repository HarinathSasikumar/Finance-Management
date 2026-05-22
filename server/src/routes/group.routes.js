const express = require('express');
const router = express.Router();
const { getAllGroups, createGroup, getGroupById, updateGroup, deleteGroup } = require('../controllers/group.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/', protect, getAllGroups);
router.post('/', protect, adminOnly, createGroup);
router.get('/:id', protect, getGroupById);
router.put('/:id', protect, adminOnly, updateGroup);
router.delete('/:id', protect, adminOnly, deleteGroup);

module.exports = router;
