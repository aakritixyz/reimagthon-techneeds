const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentee', required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  enrollmentNumber: { type: String, required: true, unique: true },
}, { timestamps: true });
schema.index({ mentee: 1, program: 1 }, { unique: true });
module.exports = mongoose.model('Enrollment', schema);
