const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['due_payment', 'payment_received', 'group_created', 'member_added', 'target_achieved', 'reminder', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
