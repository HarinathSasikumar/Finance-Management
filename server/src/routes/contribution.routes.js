const express = require('express');
const router = express.Router();
const {
  getContributions,
  getContributionSummary,
  markContribution,
  updateContribution,
} = require('../controllers/contribution.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/groups/:groupId/contributions', protect, getContributions);
router.get('/groups/:groupId/contributions/summary', protect, getContributionSummary);
router.post('/contributions', protect, adminOnly, markContribution);
router.put('/contributions/:id', protect, adminOnly, updateContribution);

module.exports = router;
