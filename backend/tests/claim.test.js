const request = require("supertest");
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

  const admin = await User.create({ name: "Admin", email: "admin@p2.com", password: "pwd", role: "Administrator", tenantId: tenant1._id });
  verifierUser = await User.create({ name: "Verifier", email: "verifier@p2.com", password: "pwd", role: "Human_Verifier", tenantId: tenant1._id });
  const claimant = await User.create({ name: "Claimant", email: "claimant@p2.com", password: "pwd", role: "Claimant", tenantId: tenant1._id });

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
    const res = await request(app).post("/api/claims").set("Authorization", `Bearer ${claimantToken}`).send({ description: "Car accident" });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe("DRAFT");
    expect(res.body.data.claimId).toContain("CLM-");
    claimId = res.body.data._id;
  });

  it("should enforce valid transition (DRAFT -> SUBMITTED)", async () => {
    const res = await request(app)
      .put(`/api/claims/${claimId}/transition`)
      .set("Authorization", `Bearer ${claimantToken}`)
      .send({ nextStatus: "SUBMITTED" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("SUBMITTED");
  });

  it("should block invalid status transitions (e.g., SUBMITTED -> APPROVED)", async () => {
    const res = await request(app)
      .put(`/api/claims/${claimId}/transition`)
      .set("Authorization", `Bearer ${verifierToken}`)
      .send({ nextStatus: "APPROVED" });
    expect(res.statusCode).toBe(400); // Bad Request
    expect(res.body.message).toContain("Invalid transition");
  });

  it("should assign ownership of claim", async () => {
    const res = await request(app)
      .put(`/api/claims/${claimId}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignedToId: verifierUser._id });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.assignedTo).toBe(verifierUser._id.toString());
  });

  it("should complete the workflow correctly through to CLOSED", async () => {
    // SUBMITTED -> DOCUMENTS_PROCESSING
    await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${adminToken}`).send({ nextStatus: "DOCUMENTS_PROCESSING" });
    // DOCUMENTS_PROCESSING -> READY_FOR_HUMAN_REVIEW
    await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${adminToken}`).send({ nextStatus: "READY_FOR_HUMAN_REVIEW" });
    // READY_FOR_HUMAN_REVIEW -> UNDER_HUMAN_REVIEW
    await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${verifierToken}`).send({ nextStatus: "UNDER_HUMAN_REVIEW" });
    // UNDER_HUMAN_REVIEW -> VERIFIED
    await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${verifierToken}`).send({ nextStatus: "VERIFIED" });
    // VERIFIED -> FINAL_DECISION_PENDING
    await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${verifierToken}`).send({ nextStatus: "FINAL_DECISION_PENDING" });
    // FINAL_DECISION_PENDING -> APPROVED
    await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${adminToken}`).send({ nextStatus: "APPROVED" });
    // APPROVED -> CLOSED
    const res = await request(app).put(`/api/claims/${claimId}/transition`).set("Authorization", `Bearer ${adminToken}`).send({ nextStatus: "CLOSED" });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("CLOSED");
  });

  it("should fetch claim details with timeline history", async () => {
    const res = await request(app).get(`/api/claims/${claimId}`).set("Authorization", `Bearer ${verifierToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.claim.status).toBe("CLOSED");
    expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(8); // Created + assigned + 7 transitions
    
    // Check timeline shape
    expect(res.body.data.timeline[0].action).toBeDefined();
    expect(res.body.data.timeline[0].resourceType).toBe("Claim");
  });
});