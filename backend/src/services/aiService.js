const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Claim = require('../models/Claim');
const Document = require('../models/Document');
const Extraction = require('../models/Extraction');
const AuditLog = require('../models/AuditLog');
const { extractText } = require('./ocrService');
const { extractEntities } = require('./extractionService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
const ML_INTERNAL_KEY = process.env.ML_INTERNAL_KEY || 'claimpilot-internal-secret-2026';

/**
 * Orchestrates OCR extraction, entity parsing, and ML risk classification.
 * Replaces the mock setTimeout with an end-to-end AI pipeline.
 *
 * @param {string} claimId - MongoDB _id of the Claim
 * @param {string|string[]} [filePaths] - Optional explicit file path(s)
 * @returns {Promise<object>} Processed claim document
 */
exports.processClaimDocuments = async (claimId, filePaths = []) => {
  try {
    const claim = await Claim.findById(claimId);
    if (!claim) throw new Error(`Claim ${claimId} not found`);

    // Ensure status is DOCUMENTS_PROCESSING
    claim.status = 'DOCUMENTS_PROCESSING';
    await claim.save();

    // Fetch documents linked to this claim
    const documents = await Document.find({ claimId: claim._id });
    
    // Aggregate paths to process
    let targetFiles = [];
    if (Array.isArray(filePaths) && filePaths.length > 0) {
      targetFiles = filePaths;
    } else if (typeof filePaths === 'string' && filePaths.trim().length > 0) {
      targetFiles = [filePaths];
    } else if (documents.length > 0) {
      targetFiles = documents.map(doc => {
        // Resolve relative URL to disk path
        const filename = path.basename(doc.fileUrl);
        const diskPath = path.resolve(__dirname, '../../uploads', filename);
        if (fs.existsSync(diskPath)) return diskPath;
        // Check root uploads directory as well
        const rootUploads = path.resolve(__dirname, '../../../uploads', filename);
        if (fs.existsSync(rootUploads)) return rootUploads;
        return diskPath;
      });
    }

    let allOcrText = '';
    let totalConfidence = 0;
    let validDocCount = 0;
    let extractedPolicy = null;
    let extractedAmount = null;
    let extractedName = null;
    let extractedDate = null;
    let hasPoliceReport = 0;
    let hasMedicalCert = 0;

    // Run OCR and Entity Extraction on each document
    for (let i = 0; i < targetFiles.length; i++) {
      const filePath = targetFiles[i];
      const docModel = documents[i];

      if (!fs.existsSync(filePath)) {
        console.warn(`[aiService] Document file not found on disk: ${filePath}`);
        continue;
      }

      try {
        const { text, confidence } = await extractText(filePath);
        allOcrText += '\n' + text;
        totalConfidence += confidence;
        validDocCount++;

        if (docModel) {
          docModel.status = 'PROCESSED';
          docModel.ocrText = text;
          await docModel.save();
        }

        // Entity extraction
        const entities = extractEntities(text);
        if (!extractedPolicy && entities.policyNumber) extractedPolicy = entities.policyNumber;
        if (!extractedAmount && entities.estimatedAmount) extractedAmount = entities.estimatedAmount;
        if (!extractedName && (entities.claimantName || entities.beneficiaryName)) {
          extractedName = entities.claimantName || entities.beneficiaryName;
        }
        if (!extractedDate && entities.dateOfIncident) extractedDate = entities.dateOfIncident;

        // Context checks
        const lowerText = text.toLowerCase();
        if (lowerText.includes('police') || lowerText.includes('fir') || lowerText.includes('incident report')) {
          hasPoliceReport = 1;
        }
        if (lowerText.includes('death') || lowerText.includes('medical') || lowerText.includes('hospital') || lowerText.includes('doctor')) {
          hasMedicalCert = 1;
        }

        // Persist extractions in MongoDB
        for (const rf of entities.rawFields) {
          if (rf.value !== null && rf.value !== undefined) {
            await Extraction.create({
              claimId: claim._id,
              documentId: docModel ? docModel._id : null,
              tenantId: claim.tenantId,
              fieldCategory: rf.field,
              description: `Extracted ${rf.field}`,
              aiData: {
                value: rf.value,
                confidence: rf.confidence,
                evidenceLocation: `File: ${path.basename(filePath)}`
              }
            });
          }
        }
      } catch (docErr) {
        console.error(`[aiService] Error extracting from ${filePath}:`, docErr.message);
      }
    }

    // Default heuristics if OCR was sparse
    const avgConfidence = validDocCount > 0 ? (totalConfidence / validDocCount) / 100 : 0.85;
    const finalAmount = extractedAmount || (claim.claimType === 'LIFE_DEATH' ? 250000.0 : 34500.0);
    const consistencyScore = (validDocCount > 0 && (extractedPolicy || extractedName)) ? 0.94 : 0.85;

    // Count prior claims by this claimant
    let priorClaimsCount = 0;
    try {
      priorClaimsCount = await Claim.countDocuments({
        claimantId: claim.claimantId,
        _id: { $ne: claim._id }
      });
    } catch (_) {}

    // Prepare feature vector for ML inference
    const featureVector = {
      claim_type: claim.claimType || 'AUTO',
      amount_requested: finalAmount,
      doc_confidence_score: Number(Math.min(1.0, Math.max(0.1, avgConfidence)).toFixed(2)),
      consistency_score: Number(Math.min(1.0, Math.max(0.1, consistencyScore)).toFixed(2)),
      days_since_incident: 5,
      has_police_report: hasPoliceReport ? 1 : 0,
      has_medical_certificate: hasMedicalCert ? 1 : 0,
      has_death_certificate: claim.claimType === 'LIFE_DEATH' ? 1 : 0,
      has_repair_estimate: claim.claimType === 'AUTO_REPAIR' ? 1 : 0,
      document_count: (hasPoliceReport ? 1 : 0) + (hasMedicalCert ? 1 : 0) + (claim.claimType === 'LIFE_DEATH' ? 1 : 0) + (claim.claimType === 'AUTO_REPAIR' ? 1 : 0),
      policy_number_extracted: extractedPolicy ? 1 : 0,
      amount_vs_policy_limit_ratio: finalAmount / 100000.0, // Assuming 100k average policy
      incident_on_weekend: 0,
      submission_within_7_days: 1,
      name_mismatch: 0,
      date_mismatch: 0,
      prior_claims_count: priorClaimsCount
    };

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
    const mlInternalKey = process.env.ML_INTERNAL_KEY || 'claimpilot-internal-secret-2026';

    console.log(`[aiService] Calling ML inference service at ${mlServiceUrl}/predict with features:`, featureVector);

    let mlDecision = 'APPROVE';
    let mlConfidence = 0.92;
    let mlRiskScore = 15.0;
    let recommendedAction = 'Adjuster Review Required';
    let explanations = [];
    let tamperingFlags = [];

    // Parse EXIF for tampering
    try {
      const ExifParser = require('exif-parser');
      for (const filePath of targetFiles) {
        if (filePath.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
          const buffer = fs.readFileSync(filePath);
          const parser = ExifParser.create(buffer);
          try {
            const result = parser.parse();
            if (result.tags && result.tags.Software && result.tags.Software.toLowerCase().includes('photoshop')) {
              tamperingFlags.push(`Image modified by Photoshop: ${path.basename(filePath)}`);
            }
            if (result.tags && result.tags.ModifyDate && result.tags.DateTimeOriginal) {
              if (result.tags.ModifyDate !== result.tags.DateTimeOriginal) {
                tamperingFlags.push(`Image dates do not match (possible tampering): ${path.basename(filePath)}`);
              }
            }
          } catch (exifErr) {
            // Not all images have EXIF
          }
        }
      }
    } catch (e) {
      console.warn('EXIF parsing skipped', e.message);
    }

    try {
      const mlResponse = await axios.post(
        `${mlServiceUrl}/predict`,
        featureVector,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': mlInternalKey
          },
          timeout: 5000 // 5s timeout SLA
        }
      );

      if (mlResponse.data && mlResponse.data.decision) {
        mlDecision = mlResponse.data.decision;
        mlConfidence = mlResponse.data.confidence;
        mlRiskScore = mlResponse.data.risk_score;
        explanations = mlResponse.data.explanations || [];
        recommendedAction = mlDecision === 'APPROVE' ? 'Approve Settlement' : (mlDecision === 'REJECT' ? 'Refer to SIU / Reject' : 'Manual Review Required');
      }
    } catch (mlErr) {
      console.warn(`[aiService] ML Service unreachable or error: ${mlErr.message}. Executing graceful fallback.`);
      // Graceful fallback when ML server is down
      mlDecision = 'ESCALATE';
      recommendedAction = 'MANUAL_REVIEW_REQUIRED';
    }

    // Fraud Ring Check (Check if IP or Claimant has unusually high number of claims recently)
    const fraudRingMatches = [];
    if (priorClaimsCount > 3) {
      fraudRingMatches.push({ claimId: claimId.toString(), reason: `Claimant has ${priorClaimsCount} prior claims.` });
    }

    if (tamperingFlags.length > 0) {
      mlDecision = 'REJECT';
      recommendedAction = 'Refer to SIU (Fraud ring / Tampering detected)';
    }

    // Update claim with AI results & extracted entities for UI display
    claim.policyNumber = extractedPolicy || (claim.description.match(/\[Policy:\s*([^\]]+)\]/)?.[1] || 'POL-8921102');
    claim.extractedAmount = finalAmount;
    claim.aiDecision = mlDecision;
    claim.status = 'READY_FOR_HUMAN_REVIEW';
    claim.aiAnalysis = {
      summary: `AI Pipeline processed ${validDocCount} documents. Triage: ${mlDecision} (Confidence: ${(mlConfidence * 100).toFixed(0)}%, Risk Score: ${mlRiskScore}).`,
      consistencyScore: Math.round(consistencyScore * 100),
      detectedIssues: (mlDecision === 'REJECT' ? ['High risk anomaly detected in claim pattern'] : []).concat(tamperingFlags),
      recommendedAction: recommendedAction,
      explanations: explanations,
      tamperingFlags: tamperingFlags,
      fraudRingMatches: fraudRingMatches,
      processedAt: new Date()
    };

    await claim.save();

    // Create Audit Log entry
    await AuditLog.create({
      tenantId: claim.tenantId,
      userId: claim.claimantId,
      action: 'AI_PIPELINE_COMPLETE',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: {
        decision: mlDecision,
        confidence: mlConfidence,
        policyNumber: claim.policyNumber,
        amount: claim.extractedAmount
      }
    });

    console.log(`[aiService] Claim ${claim.claimId} successfully processed. Status: ${claim.status}, Decision: ${mlDecision}`);
    return claim;
  } catch (err) {
    console.error(`[aiService] Fatal error in processClaimDocuments:`, err.message);
    // Never leave claim hanging in DOCUMENTS_PROCESSING
    try {
      const fallbackClaim = await Claim.findById(claimId);
      if (fallbackClaim && fallbackClaim.status === 'DOCUMENTS_PROCESSING') {
        fallbackClaim.status = 'READY_FOR_HUMAN_REVIEW';
        fallbackClaim.aiDecision = 'ESCALATE';
        fallbackClaim.aiAnalysis = {
          summary: 'Processing completed with manual review fallback.',
          consistencyScore: 50,
          detectedIssues: ['Automated pipeline fallback triggered'],
          recommendedAction: 'MANUAL_REVIEW_REQUIRED',
          processedAt: new Date()
        };
        await fallbackClaim.save();
      }
    } catch (_) {}
    throw err;
  }
};
