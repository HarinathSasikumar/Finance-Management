const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    monthlyContribution: { type: Number, required: true, min: 1 },
    durationMonths: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    totalTarget: { type: Number, default: 0 },
    // Custom target support
    useCustomTarget: { type: Boolean, default: false },
    customTarget: { type: Number, default: null },
  },
  { timestamps: true }
);

// Auto-calculate totalTarget on save (respect custom target if set)
groupSchema.pre('save', function (next) {
  if (this.useCustomTarget && this.customTarget && this.customTarget > 0) {
    this.totalTarget = this.customTarget;
  } else {
    this.totalTarget = this.monthlyContribution * this.durationMonths * (this.members?.length || 0);
  }
  next();
});

// Virtual: end date
groupSchema.virtual('endDate').get(function () {
  const end = new Date(this.startDate);
  end.setMonth(end.getMonth() + this.durationMonths);
  return end;
});

groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);
