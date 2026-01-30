import mongoose from 'mongoose';

const visaRuleSchema = new mongoose.Schema({
  visaType: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
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
      type: String
    },
    operator: {
      type: String,
      enum: ['==', '!=', '>', '<', '>=', '<=', 'includes', 'exists']
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
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

