
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Claim = require('../models/Claim');
const Document = require('../models/Document');
const Extraction = require('../models/Extraction');
const jwt = require('jsonwebtoken');

exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Clear DB for clean demo state
    await Tenant.deleteMany();
    await User.deleteMany();
    await Claim.deleteMany();
    await Document.deleteMany();
    await Extraction.deleteMany();

    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    const admin = await User.create({ tenantId: tenant._id, name: 'Admin User', email: 'admin@acme.com', password: 'password123', role: 'Administrator' });
    const adjuster = await User.create({ tenantId: tenant._id, name: 'Jane Adjuster', email: 'verifier@acme.com', password: 'password123', role: 'Human_Verifier' });
    
    // Create Mock Claims
    const lifeClaim = await Claim.create({
      claimId: 'CLM-8001',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'LIFE_DEATH',
      description: 'Life Insurance Payout',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'Vital records match.', consistencyScore: 99, detectedIssues: [], recommendedAction: 'Approve' }
    });

    // Add documents for lifeClaim
    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'policy_document_1.pdf', fileUrl: '/uploads/policy_document_1.pdf' });
    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'death_certificate_1.pdf', fileUrl: '/uploads/death_certificate_1.pdf' });
    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'medical_report.pdf', fileUrl: '/uploads/medical_report.pdf' });
    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'id_proof_aadhaar.jpg', fileUrl: '/uploads/id_proof_aadhaar.jpg' });

    const autoClaim = await Claim.create({
      claimId: 'CLM-8002',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'AUTO',
      description: 'Collision repair',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'OEM Rates matched.', consistencyScore: 92, detectedIssues: [], recommendedAction: 'Approve' }
    });

    // Add documents for autoClaim
    await Document.create({ claimId: autoClaim._id, tenantId: tenant._id, fileName: 'police_fir_auto.pdf', fileUrl: '/uploads/police_fir_auto.pdf' });
    await Document.create({ claimId: autoClaim._id, tenantId: tenant._id, fileName: 'car_damage_photo.jpg', fileUrl: '/uploads/car_damage_photo.jpg' });
    await Document.create({ claimId: autoClaim._id, tenantId: tenant._id, fileName: 'repair_estimate.pdf', fileUrl: '/uploads/repair_estimate.pdf' });

    const propertyClaim = await Claim.create({
      claimId: 'CLM-8003',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'PROPERTY',
      description: 'Fire Damage at Warehouse',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'Fire report validated. Damage estimate aligned.', consistencyScore: 88, detectedIssues: [], recommendedAction: 'Approve' }
    });

    // Add documents for propertyClaim
    await Document.create({ claimId: propertyClaim._id, tenantId: tenant._id, fileName: 'fire_report_property.pdf', fileUrl: '/uploads/fire_report_property.pdf' });

    // Create Extractions
    await Extraction.create({ claimId: lifeClaim._id, tenantId: tenant._id, fieldCategory: 'Beneficiary', description: 'Jane Ford', aiData: { value: 'Verified', confidence: 99 }});
    await Extraction.create({ claimId: lifeClaim._id, tenantId: tenant._id, fieldCategory: 'DeathCert', description: 'State Registry', aiData: { value: 'Authentic', confidence: 98 }});

    await Extraction.create({ claimId: autoClaim._id, tenantId: tenant._id, fieldCategory: 'LineItem', description: 'Front Bumper OEM', aiData: { value: 850.00, confidence: 92 }});
    await Extraction.create({ claimId: autoClaim._id, tenantId: tenant._id, fieldCategory: 'LineItem', description: 'Labor (4.5 hrs)', aiData: { value: 405.00, confidence: 98 }});

    await Extraction.create({ claimId: propertyClaim._id, tenantId: tenant._id, fieldCategory: 'Assessment', description: 'Total Fire Damage', aiData: { value: 125000.00, confidence: 89 }});


    const targetUser = role === 'Administrator' ? admin : adjuster;
    const token = jwt.sign({ id: targetUser._id, role: targetUser.role, tenantId: tenant._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    res.json({ token, role: targetUser.role });
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
      const claims = await Claim.find(query);
      res.json(claims);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getClaimDetails = async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.id, tenantId: req.tenantId });
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
    const user = await User.findOne({ tenantId: req.tenantId });
    const isLife = Math.random() > 0.5;
    
    const newClaim = await Claim.create({
      tenantId: req.tenantId,
      claimantId: user._id,
      claimType: isLife ? 'LIFE_DEATH' : 'AUTO',
      description: isLife ? 'Automated Death Benefit Submission' : 'Automated Collision Submission',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { 
        summary: 'AI Pipeline ingestion complete. Ready for adjuster review.', 
        consistencyScore: Math.floor(Math.random() * 20) + 80, 
        detectedIssues: [], 
        recommendedAction: 'Verify line items' 
      }
    });

    if (isLife) {
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'Beneficiary', description: 'John Doe Jr.', aiData: { value: 'Verified', confidence: 99 }});
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'DeathCert', description: 'State Registry API', aiData: { value: 'Authentic', confidence: 98 }});
    } else {
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'LineItem', description: 'Rear Bumper Assembly', aiData: { value: 1200.00, confidence: 91 }});
      await Extraction.create({ claimId: newClaim._id, tenantId: req.tenantId, fieldCategory: 'LineItem', description: 'Paint & Blending', aiData: { value: 350.00, confidence: 85 }});
    }

    res.json(newClaim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

  exports.submitClaimantClaim = async (req, res) => {
    try {
      const { type, description, dateOfLoss, location, nomineeName, policyHolderName } = req.body;
      
      // Find the claimant from auth context
      const user = req.user;
      
      // Create the real claim
      const newClaim = await Claim.create({
        tenantId: req.tenantId,
        claimantId: user._id,
        claimType: type,
        description: `[Policy: ${policyHolderName || 'Unknown'}] ${description}`,
        status: 'DOCUMENTS_PROCESSING',
        aiAnalysis: { 
          summary: 'Extracting data from applicant uploads...', 
          consistencyScore: 0, 
          detectedIssues: [], 
          recommendedAction: 'Wait for AI' 
        }
      });
  
      // Save actual uploaded files to the Document model
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
  
      // Simulate AI Pipeline Background Processing
      setTimeout(async () => {
        const claimToUpdate = await Claim.findById(newClaim._id);
        if(claimToUpdate) {
          claimToUpdate.status = 'READY_FOR_HUMAN_REVIEW';
          claimToUpdate.aiAnalysis = {
            summary: `Processed ${req.files ? req.files.length : 0} documents. All checks passed.`,
            consistencyScore: 94,
            detectedIssues: [],
            recommendedAction: 'Adjuster Review Required'
          };
          await claimToUpdate.save();
  
          if (type === 'LIFE_DEATH') {
            await Extraction.create({ claimId: claimToUpdate._id, tenantId: req.tenantId, fieldCategory: 'Beneficiary', description: nomineeName || 'Unknown Applicant', aiData: { value: 'Verified', confidence: 99 }});
            await Extraction.create({ claimId: claimToUpdate._id, tenantId: req.tenantId, fieldCategory: 'Policy Holder', description: policyHolderName || 'Unknown', aiData: { value: 'Deceased', confidence: 99 }});
          } else {
            await Extraction.create({ claimId: claimToUpdate._id, tenantId: req.tenantId, fieldCategory: 'DamageEstimate', description: 'Total Repair Cost', aiData: { value: 3450.00, confidence: 92 }});
          }
        }
      }, 4000);
  
      res.json(newClaim);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
