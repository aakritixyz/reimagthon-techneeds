const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionIndex: Number, // Index of the question in the quiz
  selectedOptionIndex: Number
});

const QuizSubmissionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentee', required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  answers: [AnswerSchema],
  score: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

QuizSubmissionSchema.index({ quiz: 1, mentee: 1 }, { unique: true }); // One submission per mentee per quiz

module.exports = mongoose.model('QuizSubmission', QuizSubmissionSchema);
