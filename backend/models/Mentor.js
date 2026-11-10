const mongoose = require('mongoose');

const MentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false },
  maxTracks: { type: Number, default: 2 },
  seatsPerTrack: { type: Number, default: 8 },
  trackScores: { type: Map, of: Number, default: {} },
  programs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Program' 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Mentor', MentorSchema);