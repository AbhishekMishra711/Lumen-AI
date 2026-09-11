const mongoose = require('mongoose');

const MindMapSchema = new mongoose.Schema(
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
    sourceName: {
      type: String,
      default: 'Document',
    },
    hierarchy: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    flowData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MindMap', MindMapSchema);
