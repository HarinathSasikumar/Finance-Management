const Contribution = require('../models/Contribution');
const Group = require('../models/Group');
const Member = require('../models/Member');
const Notification = require('../models/Notification');
const { addLedgerEntry } = require('../utils/ledger.util');
const { recalculateGroupRankings } = require('../utils/ranking.util');

// GET /api/groups/:groupId/contributions
exports.getContributions = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { groupId: req.params.groupId };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const contributions = await Contribution.find(filter)
      .populate('memberId', 'name email')
      .sort({ year: 1, month: 1 });

    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/groups/:groupId/contributions/summary
exports.getContributionSummary = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const allContributions = await Contribution.find({ groupId }).populate('memberId', 'name');

    // Group by month/year
    const monthlyMap = {};
    for (const c of allContributions) {
      const key = `${c.year}-${String(c.month).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: c.month, year: c.year, paid: 0, partial: 0, pending: 0, total: 0, collected: 0 };
      }
      monthlyMap[key].total++;
      if (c.status === 'paid') {
        monthlyMap[key].paid++;
        monthlyMap[key].collected += (Number(c.paidAmount) || c.amount);
      } else if (c.status === 'partial') {
        monthlyMap[key].partial++;
        monthlyMap[key].collected += (Number(c.paidAmount) || 0);
      } else {
        monthlyMap[key].pending++;
      }
    }

    const months = Object.values(monthlyMap).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );

    const memberCount = await Member.countDocuments({ groupId, isActive: true });
    const monthsWithTarget = months.map((m) => {
      const target = memberCount * group.monthlyContribution;
      return {
        ...m,
        target,
        achievedPercent: target > 0 ? Math.round((m.collected / target) * 100) : 0,
        status: m.collected >= target ? 'Achieved' : 'Not Achieved',
      };
    });

    res.json(monthsWithTarget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/contributions - mark payment (supports partial payments)
exports.markContribution = async (req, res) => {
  try {
    const { memberId, groupId, month, year, status, paidAmount: rawPaidAmount, note } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const requiredAmount = group.monthlyContribution;

    // Determine effective paidAmount and final status
    let paidAmount = Number(rawPaidAmount) || 0;
    let finalStatus = status;

    // If paidAmount is provided, auto-calculate status
    if (rawPaidAmount !== undefined && rawPaidAmount !== '') {
      paidAmount = Math.min(paidAmount, requiredAmount); // cannot exceed required
      if (paidAmount >= requiredAmount) {
        finalStatus = 'paid';
        paidAmount = requiredAmount; // cap at full amount
      } else if (paidAmount > 0) {
        finalStatus = 'partial';
      } else {
        finalStatus = 'pending';
      }
    } else {
      // Legacy toggle (no paidAmount given): treat as full payment or reset
      if (status === 'paid') paidAmount = requiredAmount;
      else paidAmount = 0;
    }

    let contribution = await Contribution.findOne({ memberId, groupId, month, year });
    const previousStatus = contribution?.status;
    const previousPaidAmount = contribution?.paidAmount || 0;

    if (contribution) {
      contribution.status = finalStatus;
      contribution.paidAmount = paidAmount;
      contribution.note = note || '';
      if (finalStatus === 'paid' || finalStatus === 'partial') {
        contribution.paidAt = new Date();
      } else {
        contribution.paidAt = null;
      }
      await contribution.save();
    } else {
      contribution = await Contribution.create({
        memberId, groupId, month, year,
        amount: requiredAmount,
        paidAmount,
        status: finalStatus,
        note: note || '',
        paidAt: finalStatus !== 'pending' ? new Date() : null,
      });
    }

    // ── Ledger entry logic ──
    const amountDelta = paidAmount - previousPaidAmount; // net change

    if (amountDelta > 0) {
      // New money received — credit the difference
      const statusLabel = finalStatus === 'partial'
        ? `Partial payment (₹${paidAmount} of ₹${requiredAmount})`
        : `Payment`;
      await addLedgerEntry({
        groupId,
        type: 'credit',
        amount: amountDelta,
        description: `${statusLabel} from ${member.name} for ${month}/${year}`,
        referenceId: contribution._id,
        addedBy: req.user._id,
      });
    } else if (amountDelta < 0) {
      // Payment reduced or reversed — debit the difference
      await addLedgerEntry({
        groupId,
        type: 'debit',
        amount: Math.abs(amountDelta),
        description: `Payment adjustment for ${member.name} — ${month}/${year}`,
        referenceId: contribution._id,
        addedBy: req.user._id,
      });
    }

    // Notification only on first payment or status upgrade
    if ((finalStatus === 'paid' || finalStatus === 'partial') && previousStatus === 'pending') {
      const remaining = requiredAmount - paidAmount;
      await Notification.create({
        userId: req.user._id,
        groupId,
        memberId,
        message: finalStatus === 'partial'
          ? `${member.name} partially paid ₹${paidAmount} of ₹${requiredAmount} for ${month}/${year}. Remaining: ₹${remaining}.`
          : `${member.name} has paid ₹${paidAmount} for ${month}/${year}.`,
        type: 'payment_received',
      });
    }

    await recalculateGroupRankings(groupId);

    res.json({ ...contribution.toJSON(), remainingAmount: Math.max(0, requiredAmount - paidAmount) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// PUT /api/contributions/:id
exports.updateContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });
    res.json(contribution);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
