const Group = require('../models/Group');
const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const Ledger = require('../models/Ledger');
const User = require('../models/User');

// GET /api/analytics/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalGroups = await Group.countDocuments();
    const totalMembers = await Member.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();

    const allContributions = await Contribution.find();
    const totalCollected = allContributions
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0);

    const pendingCount = allContributions.filter((c) => c.status === 'pending').length;
    const paidCount = allContributions.filter((c) => c.status === 'paid').length;

    // Monthly trend (last 6 months)
    const now = new Date();
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const paid = allContributions.filter((c) => c.month === m && c.year === y && c.status === 'paid');
      const amount = paid.reduce((s, c) => s + c.amount, 0);
      monthlyTrend.push({
        label: `${d.toLocaleString('default', { month: 'short' })} ${y}`,
        month: m,
        year: y,
        amount,
        count: paid.length,
      });
    }

    // Group performance summary
    const groups = await Group.find().populate('members');
    const groupPerformance = await Promise.all(
      groups.map(async (g) => {
        const memberCount = g.members.length;
        const paid = await Contribution.countDocuments({ groupId: g._id, status: 'paid' });
        const total = await Contribution.countDocuments({ groupId: g._id });
        const collected = await Contribution.aggregate([
          { $match: { groupId: g._id, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const target = g.monthlyContribution * g.durationMonths * memberCount;
        const collectedAmount = collected[0]?.total || 0;
        return {
          id: g._id,
          name: g.name,
          memberCount,
          achievedPercent: target > 0 ? Math.min(100, Math.round((collectedAmount / target) * 100)) : 0,
          collectedAmount,
          target,
          status: g.status,
        };
      })
    );

    // Smart insights
    const insights = [];
    const now2 = new Date();
    const cm = now2.getMonth() + 1;
    const cy = now2.getFullYear();
    const pendingThisMonth = await Contribution.countDocuments({ month: cm, year: cy, status: 'pending' });
    if (pendingThisMonth > 0) {
      insights.push({ type: 'warning', message: `⚠️ ${pendingThisMonth} payments are pending for this month` });
    }
    for (const g of groupPerformance) {
      if (g.achievedPercent < 50) {
        insights.push({ type: 'danger', message: `🔴 Group "${g.name}" has slow collection (${g.achievedPercent}% achieved)` });
      } else if (g.achievedPercent >= 100) {
        insights.push({ type: 'success', message: `✅ Group "${g.name}" has achieved its target!` });
      }
    }

    res.json({
      stats: { totalGroups, totalMembers, totalUsers, totalCollected, pendingCount, paidCount },
      monthlyTrend,
      groupPerformance,
      insights,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/groups/:id/target
exports.getGroupTarget = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const memberCount = await Member.countDocuments({ groupId: group._id, isActive: true });
    const totalTarget = group.monthlyContribution * group.durationMonths * memberCount;

    const paid = await Contribution.aggregate([
      { $match: { groupId: group._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalCollected = paid[0]?.total || 0;
    const achievedPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

    res.json({
      totalTarget,
      totalCollected,
      remainingBalance: totalTarget - totalCollected,
      achievedPercent,
      status: achievedPercent >= 100 ? 'Achieved' : 'Not Achieved',
      memberCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/groups/:id/predictions
exports.getPredictions = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const now = new Date();
    const startDate = new Date(group.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + group.durationMonths);

    const monthsElapsed = Math.max(
      1,
      (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1
    );
    const remainingMonths = Math.max(0, group.durationMonths - monthsElapsed + 1);

    const memberCount = await Member.countDocuments({ groupId: group._id, isActive: true });

    const paid = await Contribution.aggregate([
      { $match: { groupId: group._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalCollected = paid[0]?.total || 0;
    const avgMonthlyRate = monthsElapsed > 0 ? totalCollected / monthsElapsed : 0;

    const projectedTotal = totalCollected + avgMonthlyRate * remainingMonths;
    const groupTarget = group.monthlyContribution * group.durationMonths * memberCount;
    const willAchieve = projectedTotal >= groupTarget;
    const confidence = Math.min(100, Math.round((projectedTotal / groupTarget) * 100));

    res.json({
      totalCollected,
      groupTarget,
      projectedTotal: Math.round(projectedTotal),
      willAchieve,
      confidence,
      remainingMonths,
      monthsElapsed,
      avgMonthlyRate: Math.round(avgMonthlyRate),
      message: willAchieve
        ? `✅ On track! Projected to collect ₹${Math.round(projectedTotal).toLocaleString()} vs target ₹${groupTarget.toLocaleString()}`
        : `⚠️ At current rate, group will only reach ${confidence}% of target`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/rankings - group rankings
exports.getGroupRankings = async (req, res) => {
  try {
    const groups = await Group.find().populate('members', 'name');
    const ranked = await Promise.all(
      groups.map(async (g) => {
        const memberCount = g.members.length;
        const paid = await Contribution.aggregate([
          { $match: { groupId: g._id, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const collectedAmount = paid[0]?.total || 0;
        const target = g.monthlyContribution * g.durationMonths * memberCount;
        const score = target > 0 ? Math.round((collectedAmount / target) * 100) : 0;
        return { id: g._id, name: g.name, memberCount, score, collectedAmount, target, status: g.status };
      })
    );

    ranked.sort((a, b) => b.score - a.score);
    const withRank = ranked.map((g, i) => ({ ...g, rank: i + 1 }));
    res.json(withRank);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
