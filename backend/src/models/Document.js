const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  
  // AI Outputs (Stored separately from human data)
  classification: {
    result: String,
    confidence: Number,
    detectedIssue: String,
    recommendedAction: String
  },
  quality: {
    result: String,
    confidence: Number,
    detectedIssue: String
  },
  ocrText: String,
  
  status: { type: String, default: 'UPLOADED', enum: ['UPLOADED', 'PROCESSED', 'FAILED'] }
});

module.exports = mongoose.models.Document || mongoose.model("Document", documentSchema);