require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const Tenant = require("./models/Tenant");
const User = require("./models/User");

const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Expose io to routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected via WebSocket", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

connectDB().then(async () => {
  // Auto-seed for demo environments using environment-based credentials
  const tCount = await Tenant.countDocuments();
  if (tCount === 0) {
    const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@acme.com';
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'password123';
    const verifierEmail = process.env.DEMO_VERIFIER_EMAIL || 'verifier@acme.com';
    const verifierPassword = process.env.DEMO_VERIFIER_PASSWORD || 'password123';

    const tenant = await Tenant.create({ name: 'Acme Insurance', subscriptionTier: 'ENTERPRISE' });
    await User.create({ name: 'System Admin', email: adminEmail, password: adminPassword, role: 'Administrator', tenantId: tenant._id });
    await User.create({ name: 'Jane Verifier', email: verifierEmail, password: verifierPassword, role: 'Human_Verifier', tenantId: tenant._id });
    console.log(`[Seed] Seeded Admin (${adminEmail}) and Verifier (${verifierEmail})`);
  }

  server.listen(PORT, () => {
    console.log("Server & WebSocket running on port " + PORT);
  });
});
