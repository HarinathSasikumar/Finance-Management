const Ledger = require('../models/Ledger');

/**
 * Get the current running balance for a group (from the most recent entry by date)
 */
const getLastBalance = async (groupId) => {
  const entries = await Ledger.find({ groupId }).sort({ date: 1, createdAt: 1 });
  if (!entries.length) return 0;
  const last = entries[entries.length - 1];
  // Coerce to Number to avoid any string concatenation bugs
  return Number(last.runningBalance) || 0;
};

/**
 * Create a new ledger entry and compute running balance
 */
const addLedgerEntry = async ({ groupId, type, amount, description, referenceId = null, addedBy = null, date = null }) => {
  const lastBalance = await getLastBalance(groupId);
  const numAmount = Number(amount); // ensure it's a number not a string
  let newBalance;

  if (type === 'credit') {
    newBalance = lastBalance + numAmount;
  } else {
    newBalance = lastBalance - numAmount;
  }

  const entry = await Ledger.create({
    groupId,
    type,
    amount: numAmount,
    description,
    referenceId,
    runningBalance: newBalance,
    addedBy,
    date: date || new Date(),
  });

  return entry;
};

module.exports = { getLastBalance, addLedgerEntry };

