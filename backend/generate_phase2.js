const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/backend';

const files = {
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

claimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Claim", claimSchema);`,

  'src/utils/claimStateMachine.js': `const validTransitions = {
  'DRAFT': ['SUBMITTED'],
  'SUBMITTED': ['DOCUMENTS_PROCESSING'],
  'DOCUMENTS_PROCESSING': ['READY_FOR_HUMAN_REVIEW', 'ACTION_REQUIRED'],
  'ACTION_REQUIRED': ['SUBMITTED'],
  'READY_FOR_HUMAN_REVIEW': ['UNDER_HUMAN_REVIEW'],
  'UNDER_HUMAN_REVIEW': ['VERIFIED', 'ADDITIONAL_INFO_REQUESTED'],
  'ADDITIONAL_INFO_REQUESTED': ['UNDER_HUMAN_REVIEW'],
  'VERIFIED': ['FINAL_DECISION_PENDING'],
  'FINAL_DECISION_PENDING': ['APPROVED', 'REJECTED'],
  'APPROVED': ['CLOSED'],
  'REJECTED': ['CLOSED'],
  'CLOSED': []
};

exports.isValidTransition = (currentStatus, nextStatus) => {
  const allowed = validTransitions[currentStatus];
  return allowed && allowed.includes(nextStatus);
};`,

  'src/controllers/claimController.js': `const Claim = require("../models/Claim");
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
        message: \`Invalid transition from \${currentStatus} to \${nextStatus}\` 
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
};`,

  'src/routes/claimRoutes.js': `const express = require("express");
const { 
  createClaim, 
  getClaimDetails, 
  transitionStatus, 
  assignClaim 
} = require("../controllers/claimController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.post("/", authorize('Claimant', 'Agent', 'Administrator'), createClaim);
router.get("/:id", getClaimDetails);

// Only specific roles can transition statuses beyond DRAFT/SUBMITTED
router.put("/:id/transition", authorize('Agent', 'Human_Verifier', 'Administrator', 'Claimant'), transitionStatus);

router.put("/:id/assign", authorize('Agent', 'Administrator'), assignClaim);

module.exports = router;`,

  'tests/claim.test.js': `const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");
const Claim = require("../src/models/Claim");

let mongoServer;
let adminToken, verifierToken, claimantToken;
let tenant1, verifierUser;
let claimId;

jest.setTimeout(600000); // long timeout just in case of download

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  tenant1 = await Tenant.create({ name: "Acme Insurance Phase 2" });

  const admin = await User.create({ email: "admin@p2.com", password: "pwd", role: "Administrator", tenantId: tenant1._id });
  verifierUser = await User.create({ email: "verifier@p2.com", password: "pwd", role: "Human_Verifier", tenantId: tenant1._id });
  const claimant = await User.create({ email: "claimant@p2.com", password: "pwd", role: "Claimant", tenantId: tenant1._id });

  adminToken = (await request(app).post("/api/auth/login").send({ email: "admin@p2.com", password: "pwd" })).body.token;
  verifierToken = (await request(app).post("/api/auth/login").send({ email: "verifier@p2.com", password: "pwd" })).body.token;
  claimantToken = (await request(app).post("/api/auth/login").send({ email: "claimant@p2.com", password: "pwd" })).body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Claim Lifecycle & State Machine", () => {
  
  it("should create a claim successfully (Status: DRAFT)", async () => {
    const res = await request(app).post("/api/claims").set("Authorization", \`Bearer \${claimantToken}\`).send({ description: "Car accident" });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe("DRAFT");
    expect(res.body.data.claimId).toContain("CLM-");
    claimId = res.body.data._id;
  });

  it("should enforce valid transition (DRAFT -> SUBMITTED)", async () => {
    const res = await request(app)
      .put(\`/api/claims/\${claimId}/transition\`)
      .set("Authorization", \`Bearer \${claimantToken}\`)
      .send({ nextStatus: "SUBMITTED" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("SUBMITTED");
  });

  it("should block invalid status transitions (e.g., SUBMITTED -> APPROVED)", async () => {
    const res = await request(app)
      .put(\`/api/claims/\${claimId}/transition\`)
      .set("Authorization", \`Bearer \${verifierToken}\`)
      .send({ nextStatus: "APPROVED" });
    expect(res.statusCode).toBe(400); // Bad Request
    expect(res.body.message).toContain("Invalid transition");
  });

  it("should assign ownership of claim", async () => {
    const res = await request(app)
      .put(\`/api/claims/\${claimId}/assign\`)
      .set("Authorization", \`Bearer \${adminToken}\`)
      .send({ assignedToId: verifierUser._id });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.assignedTo).toBe(verifierUser._id.toString());
  });

  it("should complete the workflow correctly through to CLOSED", async () => {
    // SUBMITTED -> DOCUMENTS_PROCESSING
    await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${adminToken}\`).send({ nextStatus: "DOCUMENTS_PROCESSING" });
    // DOCUMENTS_PROCESSING -> READY_FOR_HUMAN_REVIEW
    await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${adminToken}\`).send({ nextStatus: "READY_FOR_HUMAN_REVIEW" });
    // READY_FOR_HUMAN_REVIEW -> UNDER_HUMAN_REVIEW
    await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${verifierToken}\`).send({ nextStatus: "UNDER_HUMAN_REVIEW" });
    // UNDER_HUMAN_REVIEW -> VERIFIED
    await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${verifierToken}\`).send({ nextStatus: "VERIFIED" });
    // VERIFIED -> FINAL_DECISION_PENDING
    await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${verifierToken}\`).send({ nextStatus: "FINAL_DECISION_PENDING" });
    // FINAL_DECISION_PENDING -> APPROVED
    await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${adminToken}\`).send({ nextStatus: "APPROVED" });
    // APPROVED -> CLOSED
    const res = await request(app).put(\`/api/claims/\${claimId}/transition\`).set("Authorization", \`Bearer \${adminToken}\`).send({ nextStatus: "CLOSED" });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("CLOSED");
  });

  it("should fetch claim details with timeline history", async () => {
    const res = await request(app).get(\`/api/claims/\${claimId}\`).set("Authorization", \`Bearer \${verifierToken}\`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.claim.status).toBe("CLOSED");
    expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(8); // Created + assigned + 7 transitions
    
    // Check timeline shape
    expect(res.body.data.timeline[0].action).toBeDefined();
    expect(res.body.data.timeline[0].resourceType).toBe("Claim");
  });
});`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, filepath), content);
}
console.log('Phase 2 files generated.');
