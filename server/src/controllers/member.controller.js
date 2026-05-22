const Member = require('../models/Member');
const Group = require('../models/Group');
const Contribution = require('../models/Contribution');
const Notification = require('../models/Notification');
const { recalculateGroupRankings } = require('../utils/ranking.util');

// GET /api/groups/:groupId/members
exports.getMembers = async (req, res) => {
  try {
    const members = await Member.find({ groupId: req.params.groupId, isActive: true }).sort({ rank: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/groups/:groupId/members
exports.addMember = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = await Member.create({
      name, email, phone,
      groupId: req.params.groupId,
    });

    // Add member ref to group
    group.members.push(member._id);
    await group.save();

    // Auto-generate pending contributions for all existing months
    const now = new Date();
    const startDate = new Date(group.startDate);
    const monthsElapsed = Math.max(
      0,
      (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1
    );
    const monthsToCreate = Math.min(monthsElapsed, group.durationMonths);

    for (let i = 0; i < monthsToCreate; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      await Contribution.create({
        memberId: member._id,
        groupId: req.params.groupId,
        amount: group.monthlyContribution,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        status: 'pending',
      }).catch(() => {}); // ignore duplicates
    }

    // Notify admin
    await Notification.create({
      userId: req.user._id,
      groupId: group._id,
      memberId: member._id,
      message: `Member "${name}" has been added to group "${group.name}".`,
      type: 'member_added',
    });

    await recalculateGroupRankings(req.params.groupId);

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/groups/:groupId/members/:memberId
exports.updateMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.memberId, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/groups/:groupId/members/:memberId
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.memberId, { isActive: false }, { new: true });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // Remove from group members array
    await Group.findByIdAndUpdate(req.params.groupId, { $pull: { members: member._id } });

    res.json({ message: 'Member removed from group' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/members/rankings
exports.getMemberRankings = async (req, res) => {
  try {
    const members = await Member.find({ isActive: true })
      .populate('groupId', 'name')
      .sort({ score: -1 })
      .limit(50);
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
