const fs = require('fs');
const path = require('path');

const baseDir = 'd:/sih/backend';
const dirs = ['src/config', 'src/models', 'src/middlewares', 'src/controllers', 'src/routes', 'tests'];

dirs.forEach(d => {
  fs.mkdirSync(path.join(baseDir, d), { recursive: true });
});

const files = {
  'src/config/db.js': `const mongoose = require("mongoose");
const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};
module.exports = connectDB;`,

  'src/models/Tenant.js': `const mongoose = require("mongoose");
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Tenant", tenantSchema);`,

  'src/models/User.js': `const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Claimant', 'Agent', 'Human_Verifier', 'Administrator'], 
    required: true 
  },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);`,

  'src/models/AuditLog.js': `const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resourceType: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);`,

  'src/middlewares/auth.js': `const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) throw new Error("User not found");
    
    req.tenantId = req.user.tenantId.toString();
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Token failed" });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: \`User role \${req.user.role} is not authorized to access this route\`
      });
    }
    next();
  };
};`,

  'src/middlewares/audit.js': `const AuditLog = require("../models/AuditLog");

exports.logAction = (action, resourceType) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await AuditLog.create({
            tenantId: req.tenantId,
            userId: req.user ? req.user._id : null,
            action: action,
            resourceType: resourceType,
            details: {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode
            }
          });
        } catch (error) {
          console.error("Failed to create audit log", error);
        }
      }
    });
    next();
  };
};`,

  'src/controllers/authController.js': `const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret", { expiresIn: '1h' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, role: user.role, tenantId: user.tenantId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};`,

  'src/controllers/dashboardController.js': `exports.getDashboardData = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: \`Welcome to the dashboard. You are isolated in tenant \${req.tenantId}\`,
      role: req.user.role,
      metrics: {
        totalClaims: 12,
        pendingReview: 3
      }
    }
  });
};

exports.getAdminSettings = async (req, res) => {
  res.status(200).json({
    success: true,
    data: "Admin settings isolated to this tenant."
  });
};`,

  'src/routes/authRoutes.js': `const express = require("express");
const { login } = require("../controllers/authController");
const router = express.Router();
router.post("/login", login);
module.exports = router;`,

  'src/routes/dashboardRoutes.js': `const express = require("express");
const { getDashboardData, getAdminSettings } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middlewares/auth");
const { logAction } = require("../middlewares/audit");

const router = express.Router();

router.use(protect);

router.get("/", logAction('VIEW_DASHBOARD', 'Dashboard'), getDashboardData);
router.get("/settings", authorize('Administrator'), logAction('VIEW_SETTINGS', 'Settings'), getAdminSettings);

module.exports = router;`,

  'src/app.js': `const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan("dev"));
}

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;`,

  'tests/auth.test.js': `const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");
const AuditLog = require("../src/models/AuditLog");

let mongoServer;
let adminToken, claimantToken;
let tenant1;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  tenant1 = await Tenant.create({ name: "Acme Insurance" });

  const admin = await User.create({
    email: "admin@acme.com",
    password: "password123",
    role: "Administrator",
    tenantId: tenant1._id
  });

  const claimant = await User.create({
    email: "john@claimant.com",
    password: "password123",
    role: "Claimant",
    tenantId: tenant1._id
  });

  const resAdmin = await request(app).post("/api/auth/login").send({ email: "admin@acme.com", password: "password123" });
  adminToken = resAdmin.body.token;

  const resClaimant = await request(app).post("/api/auth/login").send({ email: "john@claimant.com", password: "password123" });
  claimantToken = resClaimant.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Auth and Roles and Audit", () => {
  it("should allow Claimant to access dashboard", async () => {
    const res = await request(app).get("/api/dashboard").set("Authorization", \`Bearer \${claimantToken}\`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.role).toBe("Claimant");
  });

  it("should deny Claimant access to admin settings", async () => {
    const res = await request(app).get("/api/dashboard/settings").set("Authorization", \`Bearer \${claimantToken}\`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("not authorized");
  });

  it("should allow Administrator access to admin settings", async () => {
    const res = await request(app).get("/api/dashboard/settings").set("Authorization", \`Bearer \${adminToken}\`);
    expect(res.statusCode).toBe(200);
  });
  
  it("should have created audit logs for the dashboard access", async () => {
    await new Promise(r => setTimeout(r, 100));
    const logs = await AuditLog.find({ tenantId: tenant1._id });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBeDefined();
  });
});`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, filepath), content);
}
console.log('Generation complete.');
