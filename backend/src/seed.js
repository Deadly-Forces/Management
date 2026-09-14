const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Tenant = require('./models/Tenant');
const User = require('./models/User');

const seed = async () => {
  await connectDB();
  
  const tenantCount = await Tenant.countDocuments();
  if (tenantCount === 0) {
    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    await User.create({ name: 'System Admin', email: 'admin@acme.com', password: 'password123', role: 'Administrator', tenantId: tenant._id });
    await User.create({ name: 'Jane Verifier', email: 'verifier@acme.com', password: 'password123', role: 'Human_Verifier', tenantId: tenant._id });
    console.log('Seeded Admin (admin@acme.com) and Verifier (verifier@acme.com) with password123');
  } else {
    console.log('Database already seeded with employee users.');
  }
  process.exit(0);
};
seed();