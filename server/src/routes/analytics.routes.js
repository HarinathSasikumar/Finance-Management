const express = require('express');
const router = express.Router();
const { getDashboard, getGroupTarget, getPredictions, getGroupRankings } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/dashboard', protect, getDashboard);
router.get('/groups/:id/target', protect, getGroupTarget);
router.get('/groups/:id/predictions', protect, getPredictions);
router.get('/rankings', protect, getGroupRankings);

module.exports = router;
