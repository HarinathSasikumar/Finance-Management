const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    groupId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Group',  required: true },
    amount:   { type: Number, required: true },              // required monthly amount
    paidAmount: { type: Number, default: 0 },               // actual amount received
    month:  { type: Number, required: true, min: 1, max: 12 },
    year:   { type: Number, required: true },
    status: { type: String, enum: ['paid', 'partial', 'pending'], default: 'pending' },
    paidAt: { type: Date, default: null },
    note:   { type: String, default: '' },
  },
  { timestamps: true }
);

// Virtual: how much still needs to be paid
contributionSchema.virtual('remainingAmount').get(function () {
  return Math.max(0, this.amount - (this.paidAmount || 0));
});

contributionSchema.set('toJSON', { virtuals: true });
contributionSchema.set('toObject', { virtuals: true });

// Compound unique index: one contribution record per member per month/year
contributionSchema.index({ memberId: 1, groupId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Contribution', contributionSchema);

