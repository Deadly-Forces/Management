const mongoose = require('mongoose');
const Claim = require('./src/models/Claim');
const Document = require('./src/models/Document');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');

const generateDemoClaims = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/claimpilot_demo');
    console.log('Connected to MongoDB');

    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    }

    let admin = await User.findOne({ email: 'admin@acme.com' });
    if (!admin) {
      admin = await User.create({ name: 'System Admin', email: 'admin@acme.com', password: 'password123', role: 'Administrator', tenantId: tenant._id });
    }

    // Delete existing claims to start fresh
    await Claim.deleteMany({});
    await Document.deleteMany({});

    // Claim 1: Life Insurance
    const lifeClaim = await Claim.create({
      claimId: 'CLM-8001',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'LIFE_DEATH',
      description: 'Life Insurance Payout for John Doe',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'Vital records match. Policy active.', consistencyScore: 99, detectedIssues: [], recommendedAction: 'Approve' }
    });

    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'policy_document_1.pdf', fileUrl: 'http://localhost:5000/uploads/policy_document_1.pdf' });
    await Document.create({ claimId: lifeClaim._id, tenantId: tenant._id, fileName: 'death_certificate_1.pdf', fileUrl: 'http://localhost:5000/uploads/death_certificate_1.pdf' });

    // Claim 2: Auto Insurance
    const autoClaim = await Claim.create({
      claimId: 'CLM-8002',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'AUTO',
      description: 'Collision repair estimate - Front bumper',
      status: 'READY_FOR_HUMAN_REVIEW',
      aiAnalysis: { summary: 'OEM Rates matched. No prior damage reported.', consistencyScore: 92, detectedIssues: [], recommendedAction: 'Approve' }
    });

    await Document.create({ claimId: autoClaim._id, tenantId: tenant._id, fileName: 'police_fir_auto.pdf', fileUrl: 'http://localhost:5000/uploads/police_fir_auto.pdf' });
    await Document.create({ claimId: autoClaim._id, tenantId: tenant._id, fileName: 'car_damage_photo.jpg', fileUrl: 'http://localhost:5000/uploads/car_damage_photo.jpg' });

    // Claim 3: Property Insurance
    const propertyClaim = await Claim.create({
      claimId: 'CLM-8003',
      tenantId: tenant._id,
      claimantId: admin._id,
      claimType: 'PROPERTY',
      description: 'Fire Damage at Warehouse 4',
      status: 'UNDER_HUMAN_REVIEW',
      aiAnalysis: { summary: 'Fire report validated. Damage estimate aligned.', consistencyScore: 88, detectedIssues: [], recommendedAction: 'Review Adjuster Report' }
    });

    await Document.create({ claimId: propertyClaim._id, tenantId: tenant._id, fileName: 'fire_report_property.pdf', fileUrl: 'http://localhost:5000/uploads/fire_report_property.pdf' });

    console.log('Successfully generated 3 demo claims with real documents.');
    process.exit(0);
  } catch (error) {
    console.error('Error generating claims:', error);
    process.exit(1);
  }
};

generateDemoClaims();
