const Claim = require("../models/Claim");
const AuditLog = require("../models/AuditLog");
const { isValidTransition } = require("../utils/claimStateMachine");

exports.createClaim = async (req, res) => {
  try {
    const claim = await Claim.create({
      tenantId: req.tenantId,
      claimantId: req.user._id,
      description: req.body.description || "New Claim",
      status: 'DRAFT'
    });
    
    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      action: 'CLAIM_CREATED',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { status: 'DRAFT' }
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getClaimDetails = async (req, res) => {
  try {
    const claim = await Claim.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('claimantId', 'email role')
      .populate('assignedTo', 'email role');
      
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    // Fetch Timeline (Audit Logs)
    const timeline = await AuditLog.find({ 
      tenantId: req.tenantId, 
      resourceId: claim._id 
    }).sort({ timestamp: -1 });

    res.status(200).json({ success: true, data: { claim, timeline } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignClaim = async (req, res) => {
  try {
    const { assignedToId } = req.body;
    const claim = await Claim.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    const prevAssignedTo = claim.assignedTo;
    claim.assignedTo = assignedToId;
    await claim.save();

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      action: 'CLAIM_ASSIGNED',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { from: prevAssignedTo, to: assignedToId }
    });

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.transitionStatus = async (req, res) => {
  try {
    const { nextStatus } = req.body;
    const claim = await Claim.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    const currentStatus = claim.status;

    // Strict Enforcement
    if (!isValidTransition(currentStatus, nextStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid transition from ${currentStatus} to ${nextStatus}` 
      });
    }

    claim.status = nextStatus;
    await claim.save();

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      action: 'STATUS_TRANSITION',
      resourceType: 'Claim',
      resourceId: claim._id,
      details: { from: currentStatus, to: nextStatus }
    });

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};