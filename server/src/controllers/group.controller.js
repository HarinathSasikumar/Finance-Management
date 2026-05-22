const Group = require('../models/Group');
const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const Ledger = require('../models/Ledger');
const Notification = require('../models/Notification');

// GET /api/groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name email score rank')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Attach collection summary to each group
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const paidContribs = await Contribution.find({ groupId: g._id, status: 'paid' });
        const totalCollected = paidContribs.reduce((sum, c) => sum + c.amount, 0);
        const memberCount = g.members.length;
        // Respect custom target if set, otherwise auto-calculate
        const totalTarget = (g.useCustomTarget && g.customTarget > 0)
          ? g.customTarget
          : g.monthlyContribution * g.durationMonths * memberCount;
        const achievedPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;
        return { ...g.toJSON(), totalCollected, totalTarget, achievedPercent, memberCount };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { name, description, monthlyContribution, durationMonths, startDate, useCustomTarget, customTarget } = req.body;

    const group = await Group.create({
      name,
      description,
      monthlyContribution,
      durationMonths,
      startDate: new Date(startDate),
      createdBy: req.user._id,
      useCustomTarget: !!useCustomTarget,
      customTarget: useCustomTarget && customTarget ? Number(customTarget) : null,
    });

    await Notification.create({
      userId: req.user._id,
      groupId: group._id,
      message: `Group "${name}" has been created successfully.${
        useCustomTarget && customTarget ? ` Custom target: ₹${Number(customTarget).toLocaleString()}` : ''
      }`,
      type: 'group_created',
    });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/groups/:id
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members')
      .populate('createdBy', 'name email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const members = await Member.find({ groupId: group._id, isActive: true }).sort({ rank: 1 });

    const contributions = await Contribution.find({ groupId: group._id })
      .populate('memberId', 'name')
      .sort({ year: 1, month: 1 });

    const ledger = await Ledger.find({ groupId: group._id })
      .populate('addedBy', 'name')
      .sort({ createdAt: 1 });

    const paidContribs = contributions.filter((c) => c.status === 'paid');
    const totalCollected = paidContribs.reduce((sum, c) => sum + c.amount, 0);
    const memberCount = members.length;
    // Respect custom target if set by admin
    const totalTarget = (group.useCustomTarget && group.customTarget > 0)
      ? group.customTarget
      : group.monthlyContribution * group.durationMonths * memberCount;
    const remainingBalance = totalTarget - totalCollected;
    const achievedPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

    const pendingMembers = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    for (const member of members) {
      const paid = contributions.find(
        (c) => c.memberId?._id?.toString() === member._id.toString() &&
          c.month === currentMonth && c.year === currentYear && c.status === 'paid'
      );
      if (!paid) pendingMembers.push(member.name);
    }

    res.json({
      group,
      members,
      contributions,
      ledger,
      summary: {
        totalCollected,
        totalTarget,
        remainingBalance,
        achievedPercent,
        memberCount,
        pendingMembers,
        status: achievedPercent >= 100 ? 'Achieved' : 'Not Achieved',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/groups/:id
exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/groups/:id
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Cascade delete
    await Member.deleteMany({ groupId: req.params.id });
    await Contribution.deleteMany({ groupId: req.params.id });
    await Ledger.deleteMany({ groupId: req.params.id });

    res.json({ message: 'Group and all related data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
