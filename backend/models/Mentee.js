const mongoose = require('mongoose');

const MenteeSchema = new mongoose.Schema({
  email: { type: String, required: true},
  name: { type: String, required: true },
  enrollmentNumber: { type: String, required: true },
  password: { type: String, required: true },
  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],
  completedResources: [{
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    completedOn: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    scoredOn: Date,

    // Optional fields for project resources
    githubLink: { type: String },
    deployedLink: { type: String },
    description: { type: String },
    submittedOn: { type: Date },
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
