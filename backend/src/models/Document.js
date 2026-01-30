import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  documentType: {
    type: String,
    enum: ['passport', 'employment', 'education', 'financial', 'other'],
    default: 'other'
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('Document', documentSchema);

