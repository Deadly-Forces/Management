const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");
const AuditLog = require("../src/models/AuditLog");

let mongoServer;
let adminToken, claimantToken;
let tenant1;

jest.setTimeout(600000); // 10 minutes for downloading MongoDB

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  tenant1 = await Tenant.create({ name: "Acme Insurance" });

  const admin = await User.create({
    name: "Admin",
    email: "admin@acme.com",
    password: "password123",
    role: "Administrator",
    tenantId: tenant1._id
  });

  const claimant = await User.create({
    name: "John Claimant",
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
    const res = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${claimantToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.role).toBe("Claimant");
  });

  it("should deny Claimant access to admin settings", async () => {
    const res = await request(app).get("/api/dashboard/settings").set("Authorization", `Bearer ${claimantToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("not authorized");
  });

  it("should allow Administrator access to admin settings", async () => {
    const res = await request(app).get("/api/dashboard/settings").set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
  
  it("should have created audit logs for the dashboard access", async () => {
    await new Promise(r => setTimeout(r, 100));
    const logs = await AuditLog.find({ tenantId: tenant1._id });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBeDefined();
  });
});