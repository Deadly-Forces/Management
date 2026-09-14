const mongoose = require("mongoose");
const crypto = require("crypto");

const claimSchema = new mongoose.Schema({
  claimId: { 
    type: String, 
    unique: true, 
    required: true,
    default: () => `CLM-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
  },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  claimantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  claimType: { type: String, enum: ['AUTO', 'PROPERTY', 'LIFE_DEATH'], default: 'AUTO' },
  status: { 
    type: String, 
    required: true,
    default: 'DRAFT',
    enum: [
      'DRAFT', 'SUBMITTED', 'DOCUMENTS_PROCESSING', 'ACTION_REQUIRED', 
      'READY_FOR_HUMAN_REVIEW', 'UNDER_HUMAN_REVIEW', 'ADDITIONAL_INFO_REQUESTED', 
      'VERIFIED', 'FINAL_DECISION_PENDING', 'APPROVED', 'REJECTED', 'CLOSED'
    ]
  },
  description: { type: String, required: true },
  
  // AI Global Claim Analysis
  aiAnalysis: {
    summary: String,
    consistencyScore: Number,
    detectedIssues: [String],
    recommendedAction: String,
    processedAt: Date
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

claimSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.models.Claim || mongoose.model("Claim", claimSchema);