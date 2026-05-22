const Notification = require('../models/Notification');
const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const Group = require('../models/Group');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    if (req.params.id === 'all') {
      await Notification.updateMany({ userId: req.user._id }, { isRead: true });
      return res.json({ message: 'All marked as read' });
    }
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/notifications/send-reminders
exports.sendReminders = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const pendingContributions = await Contribution.find({ month, year, status: 'pending' })
      .populate('memberId')
      .populate('groupId');

    const notificationsCreated = [];

    for (const contrib of pendingContributions) {
      if (!contrib.memberId || !contrib.groupId) continue;

      const notif = await Notification.create({
        userId: req.user._id,
        groupId: contrib.groupId._id,
        memberId: contrib.memberId._id,
        message: `Reminder: ${contrib.memberId.name} has a pending payment of ₹${contrib.amount} for ${month}/${year} in group "${contrib.groupId.name}".`,
        type: 'due_payment',
      });
      notificationsCreated.push(notif);
    }

    res.json({ message: `${notificationsCreated.length} reminders sent`, count: notificationsCreated.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
