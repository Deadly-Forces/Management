const { processClaimDocuments } = require("../services/aiPipelineService");
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
    
    // Emit WebSockets event
    const io = req.app.get("io");
    if (io) {
      io.emit("claim_updated", claim);
    }
    
    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};