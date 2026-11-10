const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  name: { type: String, required: true },
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