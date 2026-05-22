const Ledger = require('../models/Ledger');
const { addLedgerEntry, getLastBalance } = require('../utils/ledger.util');

// GET /api/groups/:groupId/ledger
exports.getLedger = async (req, res) => {
  try {
    const entries = await Ledger.find({ groupId: req.params.groupId })
      .populate('addedBy', 'name')
      .sort({ date: 1, createdAt: 1 }); // chronological order

    // Recalculate running balances from scratch to fix any corrupted DB values
    let runningBalance = 0;
    const correctedEntries = entries.map((entry) => {
      const amount = Number(entry.amount) || 0;
      if (entry.type === 'credit') {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }
      // Return plain object with corrected runningBalance
      return { ...entry.toJSON(), runningBalance };
    });

    const currentBalance = runningBalance;
    const totalCredits = entries
      .filter((e) => e.type === 'credit')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalDebits = entries
      .filter((e) => e.type === 'debit')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    res.json({ entries: correctedEntries, currentBalance, totalCredits, totalDebits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/groups/:groupId/ledger - manual debit entry
exports.addLedgerEntry = async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;
    const entry = await addLedgerEntry({
      groupId: req.params.groupId,
      type,
      amount,
      description,
      addedBy: req.user._id,
      date: date ? new Date(date) : null,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
