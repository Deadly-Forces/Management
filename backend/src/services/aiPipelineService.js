const Document = require("../models/Document");
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
};