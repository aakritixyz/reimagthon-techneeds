const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
  programKey: { type: String, unique: true, sparse: true, select: false },
  code: { type: String, unique: true, sparse: true },
  enrollmentSeq: { type: Number, default: 0 },
  activityRevision: { type: Number, default: 0 },
  cohort: { type: String, default: '' },
  description: { type: String, default: '' },
  startDate: Date,
  endDate: Date,
  maxMentees: { type: Number, default: 30 },
  minMentors: { type: Number, default: 1 },
  maxMentors: { type: Number, default: 5 },
  status: { type: String, enum: ['DRAFT', 'OPEN', 'ACTIVE', 'CLOSED'], default: 'DRAFT' },
  archived: { type: Boolean, default: false },
  mentors: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mentor' 
  }],
  resources: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Resource' 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Program', ProgramSchema);