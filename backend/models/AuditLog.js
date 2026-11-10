const mongoose = require('mongoose');
module.exports = mongoose.model('AuditLog', new mongoose.Schema({
  actor: { type: String, default: 'ADMIN' },
  action: { type: String, required: true },
  target: String,
  meta: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));
