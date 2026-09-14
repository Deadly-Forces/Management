const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/backend';

// Create directories if they don't exist
['src/models', 'src/ai', 'src/services', 'src/controllers', 'src/routes'].forEach(d => {
  fs.mkdirSync(path.join(baseDir, d), { recursive: true });
});

const files = {
  // --- 1. NEW DATABASE MODELS ---

  'src/models/Document.js': `const mongoose = require("mongoose");

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

module.exports = mongoose.models.Document || mongoose.model("Document", documentSchema);`,

  'src/models/Extraction.js': `const mongoose = require("mongoose");

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

module.exports = mongoose.models.Extraction || mongoose.model("Extraction", extractionSchema);`,

  // Update Claim.js to add AI Analysis fields
  'src/models/Claim.js': `const mongoose = require("mongoose");
const crypto = require("crypto");

const claimSchema = new mongoose.Schema({
  claimId: { 
    type: String, 
    unique: true, 
    required: true,
    default: () => \`CLM-\${Date.now().toString().slice(-6)}-\${crypto.randomBytes(2).toString('hex').toUpperCase()}\`
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

claimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Claim || mongoose.model("Claim", claimSchema);`,

  // --- 2. PROVIDER AGNOSTIC AI ABSTRACTION ---

  'src/ai/providerFactory.js': `const MockAIProvider = require('./mockProvider');

exports.getAIProvider = (tenantConfig = {}) => {
  // In the future, this reads tenantConfig.aiProvider (e.g. 'openai', 'gemini')
  // For Phase 4, we use the realistic MockProvider.
  return new MockAIProvider();
};`,

  'src/ai/mockProvider.js': `class MockAIProvider {
  async analyzeDocumentQuality(fileUrl) {
    return {
      result: 'USABLE',
      confidence: 98.5,
      detectedIssue: null,
      recommendedAction: 'Proceed to classification'
    };
  }

  async classifyDocument(fileUrl) {
    const isLife = fileUrl.includes('death_cert');
    return {
      result: isLife ? 'OFFICIAL_DEATH_CERTIFICATE' : 'AUTO_REPAIR_ESTIMATE',
      confidence: 99.2,
      detectedIssue: null,
      recommendedAction: 'Proceed to text extraction'
    };
  }

  async extractText(fileUrl) {
    return {
      result: 'MOCK_RAW_OCR_TEXT_BLOCK...',
      confidence: 95.0,
      detectedIssue: null,
      recommendedAction: 'Proceed to structured extraction'
    };
  }

  async extractStructuredFields(ocrText, docType) {
    if (docType === 'OFFICIAL_DEATH_CERTIFICATE') {
      return [
        { fieldCategory: 'Beneficiary', description: 'Primary Beneficiary', value: 'Jane Ford', confidence: 99.8, evidenceLocation: 'Page 1, Box 14a' },
        { fieldCategory: 'VitalCheck', description: 'Cause of Death', value: 'Natural', confidence: 95.0, evidenceLocation: 'Page 1, Box 32' }
      ];
    } else {
      return [
        { fieldCategory: 'LineItem', description: 'Front Bumper OEM', value: 850.00, confidence: 92.4, evidenceLocation: 'Page 1, Row 4' },
        { fieldCategory: 'LineItem', description: 'Labor (4.5 hrs)', value: 405.00, confidence: 98.1, evidenceLocation: 'Page 1, Row 5' },
        { fieldCategory: 'LineItem', description: 'Paint & Supplies', value: 150.00, confidence: 85.0, evidenceLocation: 'Page 2, Row 1' }
      ];
    }
  }

  async analyzeConsistency(extractions, claimData) {
    return {
      result: 'CONSISTENT',
      confidence: 94.0, // consistencyScore
      detectedIssue: null,
      recommendedAction: 'Route to Adjuster Queue'
    };
  }

  async generateSummary(extractions, claimData) {
    return {
      result: \`AI processed \${extractions.length} key data points. Documents align with standard parameters. No major anomalies detected.\`,
      confidence: 90.0,
      detectedIssue: null,
      recommendedAction: 'Requires Human Verification'
    };
  }
}

module.exports = MockAIProvider;`,

  // --- 3. PIPELINE ORCHESTRATION ---

  'src/services/aiPipelineService.js': `const Document = require("../models/Document");
const Extraction = require("../models/Extraction");
const Claim = require("../models/Claim");
const AuditLog = require("../models/AuditLog");
const { getAIProvider } = require("../ai/providerFactory");

exports.processClaimDocuments = async (claimId, tenantId) => {
  const ai = getAIProvider();
  
  // 1. Fetch Claim and Uploaded Documents
  const claim = await Claim.findOne({ _id: claimId, tenantId });
  if (!claim) throw new Error('Claim not found');
  
  const documents = await Document.find({ claimId, tenantId, status: 'UPLOADED' });
  if (documents.length === 0) throw new Error('No documents to process');

  // Transition claim to PROCESSING
  claim.status = 'DOCUMENTS_PROCESSING';
  await claim.save();
  await AuditLog.create({ tenantId, action: 'STATUS_TRANSITION', resourceType: 'Claim', resourceId: claim._id, details: { to: 'DOCUMENTS_PROCESSING' } });

  const allExtractions = [];

  for (const doc of documents) {
    // 2. Document Quality
    const quality = await ai.analyzeDocumentQuality(doc.fileUrl);
    doc.quality = quality;

    // 3. Classification
    const classification = await ai.classifyDocument(doc.fileUrl);
    doc.classification = classification;

    // 4. OCR
    const ocr = await ai.extractText(doc.fileUrl);
    doc.ocrText = ocr.result;

    doc.status = 'PROCESSED';
    await doc.save();

    // 5. Structured Field Extraction
    const fields = await ai.extractStructuredFields(doc.ocrText, classification.result);
    for (const field of fields) {
      const ext = await Extraction.create({
        claimId: claim._id,
        documentId: doc._id,
        tenantId,
        fieldCategory: field.fieldCategory,
        description: field.description,
        aiData: {
          value: field.value,
          confidence: field.confidence,
          evidenceLocation: field.evidenceLocation,
          detectedIssue: null,
          recommendedAction: 'Verify field value'
        },
        humanData: {} // Empty initially, explicitly separating AI vs Human data
      });
      allExtractions.push(ext);
    }
  }

  // 6. Cross-Document Consistency & Summarization
  const consistency = await ai.analyzeConsistency(allExtractions, claim);
  const summary = await ai.generateSummary(allExtractions, claim);

  claim.aiAnalysis = {
    summary: summary.result,
    consistencyScore: consistency.confidence,
    detectedIssues: consistency.detectedIssue ? [consistency.detectedIssue] : [],
    recommendedAction: consistency.recommendedAction,
    processedAt: new Date()
  };
  
  // Transition to Human Review
  claim.status = 'READY_FOR_HUMAN_REVIEW';
  await claim.save();
  await AuditLog.create({ tenantId, action: 'STATUS_TRANSITION', resourceType: 'Claim', resourceId: claim._id, details: { to: 'READY_FOR_HUMAN_REVIEW' } });

  return claim;
};`,

  // --- 4. CONTROLLER & ROUTES ---

  'src/controllers/pipelineController.js': `const { processClaimDocuments } = require("../services/aiPipelineService");
const Document = require("../models/Document");

exports.uploadMockDocument = async (req, res) => {
  try {
    const { claimId, fileName, fileUrl } = req.body;
    const doc = await Document.create({
      claimId,
      tenantId: req.tenantId,
      fileName,
      fileUrl
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.triggerPipeline = async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = await processClaimDocuments(claimId, req.tenantId);
    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};`,

  'src/routes/pipelineRoutes.js': `const express = require("express");
const { uploadMockDocument, triggerPipeline } = require("../controllers/pipelineController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

// Uploading documents requires Claimant or Agent
router.post("/document", authorize('Claimant', 'Agent', 'Administrator'), uploadMockDocument);

// Triggering processing is usually system-driven, but we expose it for Agents/Admins
router.post("/:claimId/trigger", authorize('Agent', 'Administrator'), triggerPipeline);

module.exports = router;`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, filepath), content);
}

// Ensure the pipeline routes are added to app.js
const appJsPath = path.join(baseDir, 'src/app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');
if (!appJsContent.includes('pipelineRoutes')) {
  appJsContent = appJsContent.replace('const claimRoutes = require("./routes/claimRoutes");', 'const claimRoutes = require("./routes/claimRoutes");\\nconst pipelineRoutes = require("./routes/pipelineRoutes");');
  appJsContent = appJsContent.replace('app.use("/api/claims", claimRoutes);', 'app.use("/api/claims", claimRoutes);\\napp.use("/api/pipeline", pipelineRoutes);');
  fs.writeFileSync(appJsPath, appJsContent);
}

console.log('Phase 4 AI Architecture generated successfully.');
