// models/Quiz.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctOptionIndex: Number,
  marks: { type: Number, default: 1 }
});

const QuizSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  questions: [QuestionSchema],
  startTime: Date,
  endTime: Date,
  revealScores: { type: Boolean, default: false } // Controlled by mentor
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
