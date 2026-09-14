const mongoose = require("mongoose");

const extractionSchema = new mongoose.Schema({
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  fieldCategory: { type: String, required: true }, // e.g., 'LineItem', 'Beneficiary', 'Total'
  description: String,
  
  // AI DATA - Strictly Read-Only / Immutable
  aiData: {
    value: mongoose.Schema.Types.Mixed,
    confidence: Number,
    evidenceLocation: String, // e.g. "Page 1, BoundingBox[10,20,100,50]"
    detectedIssue: String,
    recommendedAction: String
  },
  
  // HUMAN DATA - Separated layer for verification
  humanData: {
    value: mongoose.Schema.Types.Mixed,
    isVerified: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date
  }
});

module.exports = mongoose.models.Extraction || mongoose.model("Extraction", extractionSchema);