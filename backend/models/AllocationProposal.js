const mongoose = require('mongoose');
module.exports = mongoose.model('AllocationProposal', new mongoose.Schema({
  state: { type: String, enum: ['DRAFT', 'APPLIED'], default: 'DRAFT' },
  fingerprint: { type: String, required: true },
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  plan: { type: mongoose.Schema.Types.Mixed, required: true },
  appliedAt: Date,
}, { timestamps: true }));
