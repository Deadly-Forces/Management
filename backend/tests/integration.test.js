const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");
const Claim = require("../src/models/Claim");
const aiService = require("../src/services/aiService");

let mongoServer;
let adminToken, claimant1Token, claimant2Token;
let claimant1User, claimant2User;
let testTenant;

jest.setTimeout(600000); // 10 minutes to accommodate initial MongoDB binary download

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  testTenant = await Tenant.create({ name: "Acme Insurance", subscriptionTier: "ENTERPRISE" });

  claimant1User = await User.create({
    name: "Claimant Alpha",
    email: "alpha@claimant.com",
    password: "password123",
    role: "Claimant",
    tenantId: testTenant._id
  });

  claimant2User = await User.create({
    name: "Claimant Beta",
    email: "beta@claimant.com",
    password: "password123",
    role: "Claimant",
    tenantId: testTenant._id
  });

  const res1 = await request(app).post("/api/auth/login").send({ email: "alpha@claimant.com", password: "password123" });
  claimant1Token = res1.body.token;

  const res2 = await request(app).post("/api/auth/login").send({ email: "beta@claimant.com", password: "password123" });
  claimant2Token = res2.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe("ClaimPilot Integration & Hardening Test Suite", () => {

  // 1. Auth Login Test
  it("POST /api/demo/login -> assert 200 + token and role", async () => {
    const res = await request(app)
      .post("/api/demo/login")
      .send({ role: "Administrator" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.role).toBe("Administrator");
    adminToken = res.body.token;
  });

  // 2. Full Chain Test: Upload -> OCR -> Extraction -> ML Prediction
  it("POST /api/demo/claims/submit with valid token -> asserts claim created and status != DOCUMENTS_PROCESSING after polling", async () => {
    // Re-seed tenant and user if demoLogin cleared DB
    let currentTenant = await Tenant.findOne();
    if (!currentTenant) currentTenant = await Tenant.create({ name: "Acme Insurance" });
    let cUser = await User.findOne({ role: "Claimant" });
    if (!cUser) {
      cUser = await User.create({
        name: "Test Claimant",
        email: "test@claimant.com",
        password: "password123",
        role: "Claimant",
        tenantId: currentTenant._id
      });
    }
    const loginRes = await request(app).post("/api/auth/login").send({ email: cUser.email, password: "password123" });
    const userToken = loginRes.body.token;

    // Use a test image for upload
    const testImagePath = path.resolve(__dirname, "../../deathcertificate.webp");
    let uploadReq = request(app)
      .post("/api/demo/claims/submit")
      .set("Authorization", `Bearer ${userToken}`)
      .field("type", "LIFE_DEATH")
      .field("description", "Life insurance benefit request for deceased policyholder")
      .field("policyHolderName", "POL-992104")
      .field("nomineeName", "Jane Doe");

    if (fs.existsSync(testImagePath)) {
      uploadReq = uploadReq.attach("documents", testImagePath);
    }

    const submitRes = await uploadReq;
    expect(submitRes.statusCode).toBe(201);
    expect(submitRes.body).toHaveProperty("_id");
    const claimId = submitRes.body._id;

    // Poll for status transition (up to 35 seconds SLA)
    let finalClaim = null;
    const pollStart = Date.now();
    while (Date.now() - pollStart < 35000) {
      finalClaim = await Claim.findById(claimId);
      if (finalClaim && finalClaim.status !== "DOCUMENTS_PROCESSING") {
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    expect(finalClaim).toBeDefined();
    expect(finalClaim.status).not.toBe("DOCUMENTS_PROCESSING");
    expect(finalClaim.status).toBe("READY_FOR_HUMAN_REVIEW");
    expect(["APPROVE", "REJECT", "ESCALATE"]).toContain(finalClaim.aiDecision);
    expect(finalClaim.aiAnalysis).toHaveProperty("recommendedAction");
  }, 40000);

  // 3. Edge Case: Corrupted PDF Upload
  it("Submit claim with corrupted PDF -> assert 400 response, not 500 crash", async () => {
    const cUser = await User.findOne({ role: "Claimant" });
    const loginRes = await request(app).post("/api/auth/login").send({ email: cUser.email, password: "password123" });
    const userToken = loginRes.body.token;

    // Create a mock corrupted PDF buffer
    const corruptedBuffer = Buffer.from("NOT_A_REAL_PDF_HEADER_JUST_GARBAGE_BYTES_12345");

    const res = await request(app)
      .post("/api/demo/claims/submit")
      .set("Authorization", `Bearer ${userToken}`)
      .field("type", "AUTO")
      .field("description", "Car bumper damage collision claim")
      .attach("documents", corruptedBuffer, "corrupted_claim.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/Corrupted|invalid/i);
  });

  // 4. Edge Case: Blank Description
  it("Submit claim with blank description -> assert 400 response", async () => {
    const cUser = await User.findOne({ role: "Claimant" });
    const loginRes = await request(app).post("/api/auth/login").send({ email: cUser.email, password: "password123" });
    const userToken = loginRes.body.token;

    const res = await request(app)
      .post("/api/demo/claims/submit")
      .set("Authorization", `Bearer ${userToken}`)
      .field("type", "AUTO")
      .field("description", "   "); // Empty whitespace

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/description is required/i);
  });

  // 5. Edge Case: Claimant Isolation
  it("Two claimants submit claims -> assert neither sees the other's claims in /api/demo/my-claims", async () => {
    const tenant = await Tenant.findOne();
    const userA = await User.create({ name: "User A", email: "usera@test.com", password: "password123", role: "Claimant", tenantId: tenant._id });
    const userB = await User.create({ name: "User B", email: "userb@test.com", password: "password123", role: "Claimant", tenantId: tenant._id });

    const tokenA = (await request(app).post("/api/auth/login").send({ email: userA.email, password: "password123" })).body.token;
    const tokenB = (await request(app).post("/api/auth/login").send({ email: userB.email, password: "password123" })).body.token;

    // User A submits claim
    await request(app)
      .post("/api/demo/claims/submit")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("type", "AUTO")
      .field("description", "Claim owned exclusively by User A");

    // User B submits claim
    await request(app)
      .post("/api/demo/claims/submit")
      .set("Authorization", `Bearer ${tokenB}`)
      .field("type", "PROPERTY")
      .field("description", "Claim owned exclusively by User B");

    // User A fetches my-claims
    const resA = await request(app).get("/api/demo/my-claims").set("Authorization", `Bearer ${tokenA}`);
    expect(resA.statusCode).toBe(200);
    const descriptionsA = resA.body.map(c => c.description);
    expect(descriptionsA.some(d => d.includes("User A"))).toBe(true);
    expect(descriptionsA.some(d => d.includes("User B"))).toBe(false);

    // User B fetches my-claims
    const resB = await request(app).get("/api/demo/my-claims").set("Authorization", `Bearer ${tokenB}`);
    expect(resB.statusCode).toBe(200);
    const descriptionsB = resB.body.map(c => c.description);
    expect(descriptionsB.some(d => d.includes("User B"))).toBe(true);
    expect(descriptionsB.some(d => d.includes("User A"))).toBe(false);
  });

  // 6. Resilience: ML Server Down Fallback
  it("ML server down -> assert backend gracefully handles fallback with MANUAL_REVIEW_REQUIRED", async () => {
    const tenant = await Tenant.findOne();
    const user = await User.findOne({ role: "Claimant" });

    const claim = await Claim.create({
      tenantId: tenant._id,
      claimantId: user._id,
      claimType: "AUTO",
      description: "Fallback resilience testing claim",
      status: "DOCUMENTS_PROCESSING"
    });

    // Temporarily point ML_SERVICE_URL to unreachable port
    const originalUrl = process.env.ML_SERVICE_URL;
    process.env.ML_SERVICE_URL = "http://127.0.0.1:9999";

    try {
      const processed = await aiService.processClaimDocuments(claim._id, []);
      expect(processed.status).toBe("READY_FOR_HUMAN_REVIEW");
      expect(processed.aiDecision).toBe("ESCALATE");
      expect(processed.aiAnalysis.recommendedAction).toBe("MANUAL_REVIEW_REQUIRED");
    } finally {
      process.env.ML_SERVICE_URL = originalUrl;
    }
  });

});
