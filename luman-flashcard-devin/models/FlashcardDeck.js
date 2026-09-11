const mongoose = require('mongoose');

const SingleCardSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  keyPoints: {
    type: [String],
    default: [],
  },
});

const FlashcardDeckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    sourceType: {
      type: String,
      default: 'Content',
    },
    totalCards: {
      type: Number,
      default: 0,
    },
    flashcards: [SingleCardSchema],
    isFallback: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FlashcardDeck', FlashcardDeckSchema);
