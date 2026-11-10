const mongoose = require('mongoose');
module.exports = mongoose.model('MentorInvite', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  programIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
  usedAt: Date,
  revokedAt: Date,
}, { timestamps: true }));
