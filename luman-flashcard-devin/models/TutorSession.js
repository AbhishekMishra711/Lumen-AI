const mongoose = require('mongoose');

const TutorSessionSchema = new mongoose.Schema(
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
    sourceType: {
      type: String,
      enum: ['pdf', 'youtube', 'text', 'pptx', 'files', 'docx'],
      required: true,
    },
    sourceContent: {
      type: String,
      default: '',
    },
    curriculum: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TutorSession', TutorSessionSchema);
