const Contribution = require('../models/Contribution');
const Member = require('../models/Member');

/**
 * Recalculate and update ranks for all members in a group
 */
const recalculateGroupRankings = async (groupId) => {
  const members = await Member.find({ groupId, isActive: true });

  const scores = await Promise.all(
    members.map(async (member) => {
      const total = await Contribution.countDocuments({ memberId: member._id, groupId });
      const paid = await Contribution.countDocuments({ memberId: member._id, groupId, status: 'paid' });
      const score = total > 0 ? Math.round((paid / total) * 100) : 0;
      return { memberId: member._id, score };
    })
  );

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Assign ranks and update members
  await Promise.all(
    scores.map(async ({ memberId, score }, index) => {
      await Member.findByIdAndUpdate(memberId, { score, rank: index + 1 });
    })
  );

  return scores;
};

/**
 * Get group-level performance score
 */
const getGroupScore = async (groupId, memberCount, monthlyContribution, totalMonths) => {
  const paid = await Contribution.countDocuments({ groupId, status: 'paid' });
  const total = memberCount * totalMonths;
  return total > 0 ? Math.round((paid / total) * 100) : 0;
};

module.exports = { recalculateGroupRankings, getGroupScore };
