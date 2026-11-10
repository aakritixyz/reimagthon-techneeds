const mongoose = require('mongoose');

const MenteeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  name: { type: String, required: true },
  enrollmentNumber: { type: String, required: true },
  password: { type: String, required: true },
  mustChangePw: { type: Boolean, default: false },
  lastLoginAt: Date,
  failedLogins: { type: Number, default: 0 },
  lockedUntil: Date,
  showOnBoard: { type: Boolean, default: true },
  authVersion: { type: Number, default: 0 },
  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],
  completedResources: [{
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    completedOn: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    scoredOn: Date,
    feedback: { type: String, default: '' },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },

    // Optional fields for project resources
    githubLink: { type: String },
    deployedLink: { type: String },
    description: { type: String },
    submittedOn: { type: Date },
    submissionDates: [Date],
    verified:{type: Boolean, default:false},
  }],
  streak: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mentor',
  }
}, { timestamps: true });

MenteeSchema.index({ enrollmentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Mentee', MenteeSchema);
