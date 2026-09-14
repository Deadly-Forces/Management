const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Claim = require('../models/Claim');
const Document = require('../models/Document');
const Extraction = require('../models/Extraction');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const aiService = require('../services/aiService');

exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Clear DB for clean demo state
    await Tenant.deleteMany();
    await User.deleteMany();
    await Claim.deleteMany();
    await Document.deleteMany();
    await Extraction.deleteMany();

    const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@acme.com';
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'password123';
    const verifierEmail = process.env.DEMO_VERIFIER_EMAIL || 'verifier@acme.com';
    const verifierPassword = process.env.DEMO_VERIFIER_PASSWORD || 'password123';

    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    const admin = await User.create({ tenantId: tenant._id, name: 'Admin User', email: adminEmail, password: adminPassword, role: 'Administrator' });
    const adjuster = await User.create({ tenantId: tenant._id, name: 'Jane Adjuster', email: verifierEmail, password: verifierPassword, role: 'Human_Verifier' });
    
    // Create Mock Claims
    const lifeClaim = await Claim.create({
      claimId: 'CLM-8001',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'LIFE_DEATH',
      description: 'Life Insurance Payout',
      status: 'READY_FOR_HUMAN_REVIEW',
      policyNumber: 'POL-9921041',
      extractedAmount: 250000.0,
      aiDecision: 'APPROVE',
      aiAnalysis: { summary: 'Vital records match.', consistencyScore: 99, detectedIssues: [], recommendedAction: 'Approve' }
    });

    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'policy_document_1.pdf', fileUrl: '/uploads/policy_document_1.pdf' });
    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'death_certificate_1.pdf', fileUrl: '/uploads/death_certificate_1.pdf' });

    const autoClaim = await Claim.create({
      claimId: 'CLM-8002',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'AUTO',
      description: 'Collision repair',
      status: 'READY_FOR_HUMAN_REVIEW',
      policyNumber: 'POL-7712390',
      extractedAmount: 3450.0,
      aiDecision: 'APPROVE',
      aiAnalysis: { summary: 'OEM Rates matched.', consistencyScore: 92, detectedIssues: [], recommendedAction: 'Approve' }
    });

    await Document.create({ claimId: autoClaim._id, tenantId: tenant._id, fileName: 'repair_estimate.pdf', fileUrl: '/uploads/repair_estimate.pdf' });

    const targetUser = role === 'Administrator' ? admin : adjuster;
    const token = jwt.sign(
      { id: targetUser._id, userId: targetUser._id, claimantId: targetUser._id, role: targetUser.role, tenantId: tenant._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: targetUser.role === 'Claimant' ? '24h' : '8h' }
    );

    res.json({ token, role: targetUser.role, userId: targetUser._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClaims = async (req, res) => {
  try {
    let query = { tenantId: req.tenantId };
    if (req.user && req.user.role === 'Claimant') {
      query.claimantId = req.user._id;
    }
    const claims = await Claim.find(query).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyClaims = async (req, res) => {
  try {
    // Isolated claimant query enforcing tenant and user ownership
    const claims = await Claim.find({
      claimantId: req.user._id,
      tenantId: req.tenantId
    }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClaimDetails = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id, tenantId: req.tenantId });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    const extractions = await Extraction.find({ claimId: claim._id, tenantId: req.tenantId });
    const documents = await Document.find({ claimId: claim._id, tenantId: req.tenantId });
    res.json({ claim, extractions, documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await Claim.findOne({ claimId: req.params.id, tenantId: req.tenantId });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    
    claim.status = status;
    await claim.save();
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.simulateIngestion = async (req, res) => {
  try {
    const user = req.user || await User.findOne({ tenantId: req.tenantId });
    const isLife = Math.random() > 0.5;
    
    const newClaim = await Claim.create({
      tenantId: req.tenantId,
      claimantId: user._id,
      claimType: isLife ? 'LIFE_DEATH' : 'AUTO',
      description: isLife ? 'Automated Death Benefit Submission' : 'Automated Collision Submission',
      status: 'READY_FOR_HUMAN_REVIEW',
      policyNumber: isLife ? 'POL-9921041' : 'POL-7712390',
      extractedAmount: isLife ? 250000.0 : 3450.0,
      aiDecision: 'APPROVE',
      aiAnalysis: { 
        summary: 'AI Pipeline ingestion complete. Ready for adjuster review.', 
        consistencyScore: Math.floor(Math.random() * 20) + 80, 
        detectedIssues: [], 
        recommendedAction: 'Verify line items' 
      }
    });

    res.json(newClaim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitClaimantClaim = async (req, res) => {
  try {
    const { type, description, dateOfLoss, location, nomineeName, policyHolderName } = req.body;
    
    // Validate required fields
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Claim description is required and cannot be blank' });
    }

    // Claimant from JWT auth context
    const user = req.user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'Unauthorized claimant context' });
    }

    // Inspect uploaded files for corruption (e.g. corrupted PDF edge case)
    const filePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
          try {
            const buf = fs.readFileSync(file.path);
            // Check PDF magic header %PDF-
            if (buf.length < 5 || buf.toString('utf8', 0, 5) !== '%PDF-') {
              return res.status(400).json({ error: 'Corrupted or invalid PDF file: missing standard header' });
            }
            await pdfParse(buf);
          } catch (pdfErr) {
            return res.status(400).json({ error: 'Corrupted or invalid PDF file: unreadable stream' });
          }
        }
        filePaths.push(file.path);
      }
    }
    
    // Create Claim with ownership strictly bound to req.user._id
    const newClaim = await Claim.create({
      tenantId: req.tenantId,
      claimantId: user._id,
      claimType: type || 'AUTO',
      description: `[Policy: ${policyHolderName || 'POL-821094'}] ${description.trim()}`,
      status: 'DOCUMENTS_PROCESSING',
      aiAnalysis: { 
        summary: 'Initiating AI document extraction and risk scoring...', 
        consistencyScore: 0, 
        detectedIssues: [], 
        recommendedAction: 'Wait for AI' 
      }
    });

    // Save actual uploaded files to Document model
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await Document.create({
          claimId: newClaim._id,
          tenantId: req.tenantId,
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`
        });
      }
    }

    // Replace setTimeout mock: execute aiService.processClaimDocuments
    // Background execution keeps client responsive while ensuring status transitions
    aiService.processClaimDocuments(newClaim._id, filePaths)
      .catch(err => console.error('[demoController] aiService background processing error:', err.message));

    res.status(201).json(newClaim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
