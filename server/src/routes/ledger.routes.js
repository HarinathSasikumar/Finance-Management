const express = require('express');
const router = express.Router();
const { getLedger, addLedgerEntry } = require('../controllers/ledger.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/groups/:groupId/ledger', protect, getLedger);
router.post('/groups/:groupId/ledger', protect, adminOnly, addLedgerEntry);

module.exports = router;
