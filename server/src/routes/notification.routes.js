const express = require('express');
const router = express.Router();
const { getNotifications, markRead, sendReminders, deleteNotification } = require('../controllers/notification.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markRead);
router.post('/send-reminders', protect, adminOnly, sendReminders);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
