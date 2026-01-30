import mongoose from 'mongoose';

const visaRuleSchema = new mongoose.Schema({
  visaType: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  // Flat array for evaluation (kept for backward compatibility and fast iteration)
  requirements: [{
    category: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: true
    },
    field: {
      type: String  // Critical: Maps to extracted document data field (e.g., "educationLevel", "hasJobOffer")
    },
    operator: {
      type: String,
      enum: ['==', '!=', '>', '<', '>=', '<=', 'includes', 'exists']
    },
    value: {
      type: mongoose.Schema.Types.Mixed  // Expected value to compare against
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  // Grouped by sections for better organization and display (optional, can be generated from requirements)
  requirementsBySection: {
    type: mongoose.Schema.Types.Mixed,
    default: {}  // Structure: { "education": [...], "employment": [...], "financial": [...] }
  },
  scoringWeights: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sourceUrl: {
    type: String,
    required: true
  },
  rawContent: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  version: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

export default mongoose.model('VisaRule', visaRuleSchema);

