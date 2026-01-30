import mongoose from 'mongoose';

const eligibilityResultSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  visaType: {
    type: String,
    required: true
  },
  isEligible: {
    type: Boolean,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  criteria: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  missingRequirements: [{
    type: String
  }],
  recommendations: [{
    type: String
  }],
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('EligibilityResult', eligibilityResultSchema);

