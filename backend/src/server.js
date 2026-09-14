const app = require("./app");
const connectDB = require("./config/db");
const Tenant = require("./models/Tenant");
const User = require("./models/User");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Auto-seed for demo environments
  const tCount = await Tenant.countDocuments();
  if (tCount === 0) {
    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    await User.create({ name: 'System Admin', email: 'admin@acme.com', password: 'password123', role: 'Administrator', tenantId: tenant._id });
    await User.create({ name: 'Jane Verifier', email: 'verifier@acme.com', password: 'password123', role: 'Human_Verifier', tenantId: tenant._id });
    console.log('Seeded Admin (admin@acme.com) and Verifier (verifier@acme.com) with password123');
  }

  app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
  });
});
