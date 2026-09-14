# Comprehensive Test Strategy & Verification Survey Report

**Author**: Explorer 3 (Test Strategy Explorer)  
**Date**: 2026-09-03  
**Target System**: Automated Insurance Claims Adjudication System  
**Working Directory**: `d:\sih\.agents\teamwork_preview_explorer_survey_3`  
**Reference Document**: `d:\sih\ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

The automated insurance claims adjudication system is a mission-critical platform combining automated document intelligence (LLM triage), human-in-the-loop decision-making (Adjuster Review Cockpit), strict financial security (no automated payouts, RBAC), and operational intelligence (executive dashboard).

Testing this architecture requires a multi-layered verification strategy that goes far beyond simple unit tests. The system must be verified against strict acceptance criteria across four primary requirement areas:
1. **R1 Authentication & RBAC**: Strict JWT validation and enforcement of role permissions preventing unauthorized data access or settlement approval.
2. **R2 AI Ingestion Pipeline**: Generation of synthetic claim PDFs and damage imagery, ingestion via multipart endpoints, extraction of structured JSON with itemized costs, and deterministic 0-100 fraud risk scoring.
3. **R3 Review Cockpit & State Transitions**: Dual-pane evidence inspection, line item modification, human-in-the-loop settlement approval or SIU escalation, and direct MongoDB state mutation verification.
4. **R4 Executive Dashboard & Metrics Calculation**: Deterministic verification of mathematical aggregations for "Labor Hours Saved" and "Straight-Through Eligibility %" from multi-state seeded database records.

This survey provides:
- A complete, rigorous deconstruction of all acceptance criteria into verifiable automated assertions.
- A 4-tier E2E testing architecture covering Feature Baseline (Tier 1), Boundary & Corner Cases (Tier 2), Cross-Feature Pairwise Combinations (Tier 3), and Real-World Lifecycle Workflows (Tier 4).
- A headless automated test harness specification, database isolation strategy, and reporting blueprints (`TEST_INFRA.md` and `TEST_READY.md`).

---

## 2. Acceptance Criteria Deconstruction

### 2.1 R1: Authentication & Role-Based Access Control (RBAC)

#### Target Capability & Contract
The system must support JWT-based authentication with three pre-seeded roles: `"Adjuster"`, `"Risk Manager"`, and `"Policyholder"`. All administrative, triage, review, and adjudication endpoints must be protected.

#### Acceptance Criteria Mapping
1. **AC 1.1**: *An automated test script successfully authenticates as an "Adjuster" and a "Policyholder".*
2. **AC 1.2**: *The script verifies that the "Policyholder" token is rejected (403 Forbidden) when attempting to access Adjuster-only API endpoints.*

#### Detailed Deconstruction

| Attribute | Specification |
|---|---|
| **Target Endpoints** | `POST /api/auth/login`, `POST /api/auth/refresh`<br>`GET /api/claims/triage-queue` (Adjuster only)<br>`PATCH /api/claims/:id/line-items` (Adjuster only)<br>`POST /api/claims/:id/approve` (Adjuster only)<br>`POST /api/claims/:id/refer-siu` (Adjuster only)<br>`GET /api/dashboard/metrics` (Risk Manager & Adjuster only) |
| **Pre-Conditions** | MongoDB seeded with 3 test accounts: `adjuster@carrier.com` (role: `Adjuster`), `policyholder@carrier.com` (role: `Policyholder`), `riskmanager@carrier.com` (role: `Risk Manager`). Passwords securely hashed (bcrypt). |
| **Authentication Flow** | 1. Send `POST /api/auth/login` with `{ email, password }`.<br>2. Server validates credentials against MongoDB `users` collection.<br>3. Server returns `200 OK` with `{ token, user: { id, email, role, name } }`.<br>4. JWT payload contains `{ sub: userId, role: "Adjuster"|"Policyholder"|"Risk Manager", exp: timestamp }`. |
| **Verifiable Assertions (AC 1.1)** | - `status == 200`<br>- `response.token` is valid base64url encoded JWT.<br>- Decoded token payload has `role == "Adjuster"` for adjuster credentials.<br>- Decoded token payload has `role == "Policyholder"` for policyholder credentials.<br>- Expiration claim `exp` is in the future. |
| **Verifiable Assertions (AC 1.2)** | - Request `GET /api/claims/triage-queue` with header `Authorization: Bearer <AdjusterToken>` -> `status == 200`, returns claim array.<br>- Request `GET /api/claims/triage-queue` with header `Authorization: Bearer <PolicyholderToken>` -> `status == 403`, body contains `{ error: "Forbidden", message: "Insufficient permissions for role: Policyholder" }`.<br>- Request `POST /api/claims/:id/approve` with `PolicyholderToken` -> `status == 403 Forbidden`.<br>- Request without `Authorization` header -> `status == 401 Unauthorized`. |

---

### 2.2 R2: Automated Triage & Extraction Engine (Synthetic Claims & Ingestion)

#### Target Capability & Contract
The system must provide an ingestion pipeline capable of parsing submitted claim documents (PDFs) and photo evidence (JPEG/PNG). An integrated LLM (Gemini or OpenAI) extracts structured fields (policy info, incident, itemized costs, fraud score) and drafts a preliminary settlement. A synthetic generator script must produce sample test files.

#### Acceptance Criteria Mapping
1. **AC 2.1**: *A synthetic data generation script successfully creates sample PDF claims and image files.*
2. **AC 2.2**: *An automated test submits these synthetic files to the ingestion endpoint and verifies the endpoint returns structured JSON containing itemized costs and a 0-100 fraud risk score.*

#### Detailed Deconstruction

| Attribute | Specification |
|---|---|
| **Synthetic Generator Script** | Standalone script (e.g. `scripts/generate_synthetic_claims.js` or `scripts/generate_synthetic_claims.py`). Generates valid binary PDFs with headers `%PDF-` and realistic insurance claim layouts (claimant name, policy number, loss date, itemized invoice tables) and companion damage photos (vehicle crash, property water leak) or receipt images. |
| **Target Ingestion Endpoint** | `POST /api/claims/ingest` (Content-Type: `multipart/form-data`)<br>Fields: `document` (PDF), `evidencePhotos` (array of image files), `policyNumber` (optional metadata). |
| **LLM Extraction Processing** | Ingestion pipeline reads document text / image OCR or passes directly to multimodal LLM (Gemini 1.5 Flash / Pro or GPT-4o). The prompt instructs the model to return a strict JSON schema. |
| **Verifiable Assertions (AC 2.1)** | - Script executes without error and generates files into `test_fixtures/` or `data/synthetic/`.<br>- File system check: `claim_auto_001.pdf` exists, size > 1024 bytes, starts with magic bytes `%PDF-`.<br>- File system check: `damage_photo_001.jpg` exists, size > 1024 bytes, starts with JPEG/PNG magic bytes (`\xFF\xD8\xFF` or `\x89PNG`). |
| **Verifiable Assertions (AC 2.2)** | - Test submits synthetic files to `POST /api/claims/ingest` with valid auth token.<br>- Response `status == 200` or `201 Created`.<br>- Response body validates against strict JSON schema:<br>  * `claimId`: non-empty string (UUID/ObjectId)<br>  * `policyNumber`: string matching synthetic claim (e.g., `"POL-99281"`)<br>  * `policyholderName`: string<br>  * `dateOfLoss`: ISO date string<br>  * `lineItems`: Array with length >= 1. Each item has `{ id, description, category, requestedAmount (number > 0), status: "PENDING" }`<br>  * `fraudRiskScore`: number, `0 <= fraudRiskScore <= 100`<br>  * `fraudRationale`: string or array of strings explaining risk factors<br>  * `draftSettlement`: `{ subtotal: number, deductible: number, recommendedPayout: number }`<br>- MongoDB check: Query `claims` collection by `claimId` -> record exists with status `"TRIAGED"` or `"PENDING_REVIEW"`, containing stored line items, fraud score, and file upload references. |

---

### 2.3 R3: Adjuster Review Cockpit (Line Item Modification & State Transitions)

#### Target Capability & Contract
A human-in-the-loop dual-pane review interface allowing Adjusters to inspect extracted data side-by-side with original evidence documents. Adjusters can edit or reject individual line items and must explicitly either "Approve Settlement" or "Refer to SIU". The system enforces **no automated payouts**.

#### Acceptance Criteria Mapping
1. **AC 3.1**: *Automated UI tests (or integration tests) verify that a claim's status transitions correctly in the MongoDB database when the "Approve Settlement" or "Refer to SIU" actions are triggered.*
2. **AC 3.2**: *The UI test verifies that individual line items can be modified before approval.*

#### Detailed Deconstruction

| Attribute | Specification |
|---|---|
| **Target Endpoints & Actions** | `GET /api/claims/:id` (fetch dual pane data: document URL + extracted details)<br>`PATCH /api/claims/:id/line-items` (modify/accept/reject line items)<br>`POST /api/claims/:id/approve` (trigger settlement approval)<br>`POST /api/claims/:id/refer-siu` (trigger SIU escalation) |
| **Business Invariant** | Payout cannot occur automatically upon ingestion. Status remains `PENDING_REVIEW` until an Adjuster submits an approval or referral payload. |
| **Verifiable Assertions (AC 3.2: Line Item Modification)** | 1. Seed or retrieve claim with 3 line items (e.g. Total = $2,500).<br>2. Call `PATCH /api/claims/:id/line-items` with payload:<br>   ```json
   {
     "lineItems": [
       { "id": "item-1", "status": "ACCEPTED", "adjustedAmount": 1000 },
       { "id": "item-2", "status": "MODIFIED", "adjustedAmount": 400, "notes": "Above rate cap" },
       { "id": "item-3", "status": "REJECTED", "adjustedAmount": 0, "notes": "Wear and tear exclusion" }
     ]
   }
   ```<br>3. Verify API returns `200 OK` with recalculated settlement: `$1000 + $400 - deductible`.<br>4. Inspect MongoDB directly: Query `claims.findOne({ _id: claimId })`. Assert `lineItems[1].adjustedAmount == 400`, `lineItems[2].status == "REJECTED"`, `currentSettlementAmount == 1400 - deductible`.<br>5. In UI automated test: Playwright locates line item row 2, enters `400` in input field, clicks "Reject" on row 3, asserts summary card updates in DOM. |
| **Verifiable Assertions (AC 3.1: Approve Settlement)** | 1. Call `POST /api/claims/:id/approve` with `{ notes: "Settlement verified with contractor" }`.<br>2. Response `status == 200 OK`.<br>3. Direct MongoDB query: `claims.findOne({ _id: claimId })`.<br>4. Assert `claim.status == "APPROVED"`.<br>5. Assert `claim.approvedBy == adjusterId`, `claim.approvedAt != null`, `claim.finalSettlementAmount == 1400 - deductible`.<br>6. Assert `audit_logs` collection contains entry `{ action: "CLAIM_APPROVED", claimId, actorId: adjusterId }`. |
| **Verifiable Assertions (AC 3.1: Refer to SIU)** | 1. Reset claim to `PENDING_REVIEW` with fraud score 85.<br>2. Call `POST /api/claims/:id/refer-siu` with `{ siuReason: "Suspicious duplicate invoice detected" }`.<br>3. Response `status == 200 OK`.<br>4. Direct MongoDB query: `claims.findOne({ _id: claimId })`.<br>5. Assert `claim.status == "REFERRED_TO_SIU"`.<br>6. Assert `claim.referredToSiuAt != null`, `claim.siuReason == "Suspicious duplicate invoice detected"`.<br>7. Assert `claim.payoutDisbursed == false` (no settlement paid). |

---

### 2.4 R4: Carrier Executive & Operations Dashboard (Metrics Calculation)

#### Target Capability & Contract
An executive dashboard displaying operational metrics, a filterable triage queue, and an exportable audit log. Specifically, the metrics API must aggregate financial and velocity KPIs including "Labor Hours Saved" and "Straight-Through Eligibility %".

#### Acceptance Criteria Mapping
1. **AC 4.1**: *A test script seeds the MongoDB database with multiple claims in various states (e.g., Approved, Referred to SIU).*
2. **AC 4.2**: *The script verifies that the dashboard metrics API accurately calculates and returns the aggregate "Labor Hours Saved" and "Straight-Through Eligibility %".*

#### Mathematical Formulation & Ground Truth Specifications

##### 1. Straight-Through Eligibility % Formula
A claim is defined as "Straight-Through Eligible" if:
- `fraudRiskScore <= 20` (low fraud probability)
- `claimedTotal <= coverageLimit`
- `discrepancyCount == 0` (no policy exclusions or missing data)

$$\text{Straight-Through Eligibility \%} = \left( \frac{N_{\text{straight\_through\_eligible}}}{N_{\text{total\_claims}}} \right) \times 100$$

##### 2. Labor Hours Saved Formula
- Manual baseline adjudication time ($T_{\text{manual}}$): e.g., 3.5 hours per standard claim.
- AI-assisted review time ($T_{\text{assisted}}$):
  - For Straight-Through Eligible approved claims: 0.25 hours (quick 15-min human confirmation).
  - For standard complex review claims: 1.0 hour (30-60 min review instead of 3.5h).
  - Savings per claim $i$: $\Delta T_i = T_{\text{manual}} - T_{\text{actual}, i}$.

$$\text{Labor Hours Saved} = \sum_{i=1}^{M_{\text{adjudicated}}} (T_{\text{manual}} - T_{\text{actual}, i})$$

*Alternatively, if system uses a standardized model*:
$$\text{Labor Hours Saved} = (N_{\text{straight\_through\_approved}} \times 3.25) + (N_{\text{modified\_approved}} \times 2.5) + (N_{\text{siu\_referred}} \times 1.5)$$

#### Detailed Deconstruction

| Attribute | Specification |
|---|---|
| **Target Endpoints** | `GET /api/dashboard/metrics`<br>`GET /api/dashboard/triage-queue?status=REFERRED_TO_SIU`<br>`GET /api/audit-logs/export?format=csv` |
| **Deterministic Seeding Dataset (AC 4.1)** | The test script connects to MongoDB and inserts exactly 10 claims with predefined attributes:<br>- **Claim 1-3 (3 claims)**: Approved, Fraud Score = 10, Straight-Through Eligible = True.<br>- **Claim 4-5 (2 claims)**: Approved, Fraud Score = 45, Line items modified, Straight-Through Eligible = False.<br>- **Claim 6-7 (2 claims)**: Referred to SIU, Fraud Score = 88, Straight-Through Eligible = False.<br>- **Claim 8-9 (2 claims)**: Pending Review, Fraud Score = 15, Straight-Through Eligible = True.<br>- **Claim 10 (1 claim)**: Rejected, Fraud Score = 95, Straight-Through Eligible = False. |
| **Pre-Calculated Ground Truth (AC 4.2)** | **Total Claims**: 10<br>**Straight-Through Eligible Claims**: Claims 1, 2, 3, 8, 9 = 5 claims.<br>$$\text{Straight-Through Eligibility \%} = \frac{5}{10} \times 100 = 50.0\%$$<br>**Labor Hours Saved**: Calculated across adjudicated claims (Claims 1-5 Approved, 6-7 SIU) according to the configured formula:<br>e.g. $(3 \times 3.25) + (2 \times 2.5) + (2 \times 1.5) = 9.75 + 5.0 + 3.0 = 17.75\text{ hours}$. |
| **Verifiable Assertions (AC 4.2)** | - Test calls `GET /api/dashboard/metrics` with Risk Manager token.<br>- Response `status == 200 OK`.<br>- Response payload schema:<br>  * `metrics.totalClaims == 10`<br>  * `metrics.straightThroughEligibilityPercent == 50.0` (tolerance $\pm 0.1\%$)<br>  * `metrics.laborHoursSaved == 17.75` (tolerance $\pm 0.05$ hrs)<br>  * `metrics.statusBreakdown`: `{ "APPROVED": 5, "REFERRED_TO_SIU": 2, "PENDING_REVIEW": 2, "REJECTED": 1 }`<br>- Test queries `GET /api/dashboard/triage-queue?status=REFERRED_TO_SIU` -> returns exactly 2 records with matching IDs. |

---

## 3. The 4-Tier E2E Test Strategy & Matrix

To guarantee forensic reliability and 100% test coverage, testing is structured into four distinct tiers. Every requirement (R1-R4) has at least 5 tests in Tier 1 and at least 5 tests in Tier 2, followed by cross-cutting combinatorial and lifecycle validation.

```
+-------------------------------------------------------------------------+
|                  TIER 4: Real-World Adjudication Workflows              |
|        (Full Lifecycle: Ingestion -> Review -> Approval/SIU -> Audit)   |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
|              TIER 3: Pairwise & Cross-Feature Combinations              |
|     (Auth x Ingestion | Ingestion x Review | Review x Dashboard Metrics)|
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
|                    TIER 2: Boundary & Corner Cases                      |
|       (>=5 tests per feature: Corrupt files, 0-division, injection)     |
+-------------------------------------------------------------------------+
                                    ^
+-------------------------------------------------------------------------+
|                     TIER 1: Feature Baseline Coverage                   |
|       (>=5 tests per feature: Happy path API contracts & DB state)      |
+-------------------------------------------------------------------------+
```

---

### 3.1 Tier 1: Feature Baseline Coverage (Minimum 24 Tests)

#### Feature R1: Authentication & RBAC (6 Tests)
- **T1-R1-01**: `POST /api/auth/login` as Adjuster returns HTTP 200, valid JWT, and role `"Adjuster"`.
- **T1-R1-02**: `POST /api/auth/login` as Policyholder returns HTTP 200, valid JWT, and role `"Policyholder"`.
- **T1-R1-03**: `POST /api/auth/login` as Risk Manager returns HTTP 200, valid JWT, and role `"Risk Manager"`.
- **T1-R1-04**: `GET /api/claims/triage-queue` with Adjuster token succeeds with HTTP 200 and returns array of claims.
- **T1-R1-05**: `GET /api/claims/triage-queue` with Policyholder token is rejected with HTTP 403 Forbidden.
- **T1-R1-06**: Unauthenticated request to protected endpoints (`/api/claims/*`, `/api/dashboard/*`) returns HTTP 401 Unauthorized.

#### Feature R2: AI Ingestion & Synthetic Generation (6 Tests)
- **T1-R2-01**: Synthetic generator script runs standalone and creates a valid PDF claim file with `%PDF-` magic header and file size > 1KB.
- **T1-R2-02**: Synthetic generator script creates valid damage evidence image files (PNG/JPEG headers, file size > 1KB).
- **T1-R2-03**: `POST /api/claims/ingest` accepts synthetic PDF via multipart/form-data and returns HTTP 200/201.
- **T1-R2-04**: Ingestion response JSON contains valid itemized costs array with `description`, `category`, and `requestedAmount`.
- **T1-R2-05**: Ingestion response JSON contains `fraudRiskScore` as a numeric value strictly between 0 and 100 inclusive.
- **T1-R2-06**: Ingestion saves claim into MongoDB with initial status `"TRIAGED"` or `"PENDING_REVIEW"` and stores document metadata.

#### Feature R3: Adjuster Review Cockpit (6 Tests)
- **T1-R3-01**: `GET /api/claims/:id` returns dual-pane claim data (document URL, policy details, extracted line items).
- **T1-R3-02**: `PATCH /api/claims/:id/line-items` updates an individual line item amount and reflects update in MongoDB.
- **T1-R3-03**: `PATCH /api/claims/:id/line-items` marks a line item as `"REJECTED"` and recalculates draft settlement subtotal.
- **T1-R3-04**: `POST /api/claims/:id/approve` transitions claim status from `"PENDING_REVIEW"` to `"APPROVED"` in MongoDB.
- **T1-R3-05**: `POST /api/claims/:id/refer-siu` transitions claim status to `"REFERRED_TO_SIU"` with adjuster notes in MongoDB.
- **T1-R3-06**: Verify system invariant: Claim is never automatically set to `"APPROVED"` immediately after ingestion (human approval required).

#### Feature R4: Executive Dashboard & Operations Metrics (6 Tests)
- **T1-R4-01**: Test seeding script successfully populates MongoDB with multi-state claims (Approved, Referred to SIU, Pending).
- **T1-R4-02**: `GET /api/dashboard/metrics` returns HTTP 200 with JSON structure containing `laborHoursSaved` and `straightThroughEligibilityPercent`.
- **T1-R4-03**: Dashboard `straightThroughEligibilityPercent` matches exact calculated ratio of eligible to total claims.
- **T1-R4-04**: Dashboard `laborHoursSaved` matches exact formula calculation based on seeded claim states.
- **T1-R4-05**: `GET /api/dashboard/triage-queue?status=REFERRED_TO_SIU` filters and returns only claims with status `"REFERRED_TO_SIU"`.
- **T1-R4-06**: `GET /api/audit-logs` returns chronological log of adjuster approvals, modifications, and SIU referrals.

---

### 3.2 Tier 2: Boundary & Corner Cases (Minimum 24 Tests)

#### Boundary R1: Authentication & RBAC (6 Tests)
- **T2-R1-01**: Login with nonexistent username or wrong password returns HTTP 401 Unauthorized with generic message (no user enumeration).
- **T2-R1-02**: Expired JWT token passed in `Authorization` header returns HTTP 401 with `TokenExpiredError`.
- **T2-R1-03**: Malformed JWT string (e.g. `Bearer abc.123.xyz` with invalid signature) returns HTTP 401 Unauthorized.
- **T2-R1-04**: JWT containing tampered role payload (e.g. signature forged or secret mismatch) is rejected with HTTP 401.
- **T2-R1-05**: NoSQL injection attempt in login payload (`{"email": {"$ne": null}, "password": {"$ne": null}}`) is sanitized and rejected with HTTP 400/401.
- **T2-R1-06**: Policyholder token attempting to approve claim or refer to SIU via direct POST returns HTTP 403 Forbidden.

#### Boundary R2: AI Ingestion & Synthetic Pipeline (6 Tests)
- **T2-R2-01**: Ingestion endpoint receives zero-byte (empty) file -> returns HTTP 400 Bad Request with descriptive validation error.
- **T2-R2-02**: Ingestion receives non-PDF/non-image file (e.g. `.exe` or `.txt` renamed to `.pdf`) -> returns HTTP 422 Unprocessable Entity.
- **T2-R2-03**: Ingestion receives a synthetic claim with intentionally severe fraud indicators (duplicated receipt IDs, conflicting loss dates) -> returns `fraudRiskScore >= 80`.
- **T2-R2-04**: Ingestion receives a pristine synthetic standard claim with zero discrepancies -> returns `fraudRiskScore <= 20`.
- **T2-R2-05**: Ingestion receives large multi-page claim document with 50+ line items -> successfully parses all line items without truncation.
- **T2-R2-06**: Ingestion receives document with missing policy number -> flags claim as `"UNVERIFIED_POLICY"` without crashing server.

#### Boundary R3: Adjuster Review Cockpit (6 Tests)
- **T2-R3-01**: Adjuster submits line item modification with negative amount (`adjustedAmount: -500`) -> rejected with HTTP 400 Validation Error.
- **T2-R3-02**: Adjuster rejects all line items on a claim and clicks Approve -> system records settlement amount as $0.00 and status `"CLOSED_NO_PAYOUT"`.
- **T2-R3-03**: Double approval attempt: calling `POST /api/claims/:id/approve` on an already `"APPROVED"` claim returns HTTP 409 Conflict.
- **T2-R3-04**: Calling `POST /api/claims/:id/refer-siu` on an already `"APPROVED"` claim returns HTTP 409 Conflict (terminal state protection).
- **T2-R3-05**: Adjuster submits SIU referral with empty reason string -> rejected with HTTP 400 Bad Request (justification mandatory).
- **T2-R3-06**: Concurrent modification: Two adjusters modifying line items simultaneously -> optimistic locking / version checking handles race condition cleanly.

#### Boundary R4: Executive Dashboard & Operations Metrics (6 Tests)
- **T2-R4-01**: Empty database boundary: When 0 claims exist in MongoDB, `GET /api/dashboard/metrics` returns `laborHoursSaved: 0` and `straightThroughEligibilityPercent: 0` (no division-by-zero / NaN).
- **T2-R4-02**: 100% boundary: When all seeded claims are straight-through eligible, API returns exactly `100.0%`.
- **T2-R4-03**: 0% boundary: When all seeded claims are high-fraud SIU referrals, API returns exactly `0.0%`.
- **T2-R4-04**: High volume stress boundary: When 1,000 claims are seeded in MongoDB, dashboard metrics endpoint responds in < 500ms using indexed aggregation pipelines.
- **T2-R4-05**: Filter boundary: Filtering triage queue by non-existent status (`status=INVALID_STATUS`) returns HTTP 400 Bad Request.
- **T2-R4-06**: Date range boundary: Filtering dashboard by future date range returns empty set with 0 metrics and HTTP 200 OK.

---

### 3.3 Tier 3: Pairwise & Cross-Feature Combinations

Testing interaction dynamics between independent system components:

| Combination ID | Interacting Features | Scenario Description | Expected Outcome |
|---|---|---|---|
| **T3-COMB-01** | R1 (Auth) × R2 (Ingestion) | Policyholder uploads synthetic claim via `POST /api/claims/ingest`. | Claim is ingested with `submittedBy == policyholderId`. Claim is assigned to Adjuster queue. Policyholder cannot see internal fraud risk score or adjuster notes. |
| **T3-COMB-02** | R2 (Ingestion) × R3 (Review) | Ingestion creates claim with 4 line items. Adjuster modifies line item 1 and approves claim. | MongoDB maintains immutable `extractedData` alongside mutable `adjudicatedData`. Both raw and final line items preserved in database. |
| **T3-COMB-03** | R2 (Ingestion) × R4 (Dashboard) | High-fraud synthetic claim (score 90) ingested. | Dashboard queue dynamically increments `highRiskQueueCount` without manual intervention or server restart. |
| **T3-COMB-04** | R3 (Review) × R4 (Dashboard) | Adjuster reviews and approves 3 claims and refers 2 claims to SIU. | Dashboard metrics API immediately reflects updated `laborHoursSaved` and recalculates aggregate settlement totals. |
| **T3-COMB-05** | R1 (Auth) × R4 (Audit Log) | Risk Manager requests CSV export of audit logs; Policyholder requests same export. | Risk Manager receives HTTP 200 with complete audit trail CSV. Policyholder receives HTTP 403 Forbidden. |
| **T3-COMB-06** | R2 (Ingestion) × R3 (Cockpit) × R4 (Metrics) | Straight-through eligible claim ingested, reviewed in 5 minutes, approved by Adjuster. | Claim transitions to `APPROVED`; dashboard reflects straight-through eligibility increment and optimal labor hour savings credit. |

---

### 3.4 Tier 4: Real-World Adjudication Workflows (Full Lifecycles)

#### Workflow 1: Happy Path Straight-Through Adjudication
1. **Generator**: Synthetic script creates auto glass repair claim (`$350.00`) with matching policy `POL-AUTO-101` and windshield crack photo.
2. **Ingestion**: Uploaded to `POST /api/claims/ingest`.
3. **AI Triage**: LLM extracts policy, itemized glass replacement, assigns fraud risk score of 8/100, flags as Straight-Through Eligible. Status saved as `PENDING_REVIEW`.
4. **Cockpit UI**: Adjuster opens dual pane, reviews windshield photo alongside extracted glass repair line item ($350).
5. **Adjuster Action**: Adjuster accepts line item as extracted, enters "Quick review verified", clicks "Approve Settlement".
6. **Persistence & Metrics**:
   - Status transitions to `APPROVED` in MongoDB.
   - Payout scheduled: `$350 - deductible`.
   - Dashboard increments `laborHoursSaved` by 3.25 hrs.
   - Audit log records approval event with timestamp and adjuster ID.

#### Workflow 2: Disputed Line Item & Deductive Adjustment Workflow
1. **Generator**: Synthetic script creates residential water damage claim with 5 line items totaling `$12,000` (dryout: $3,000, drywall: $2,500, flooring: $4,500, luxury upgraded fixtures: $2,000).
2. **Ingestion**: Uploaded to ingestion endpoint.
3. **AI Triage**: Extracted with fraud score 28/100 (standard risk). Status set to `PENDING_REVIEW`.
4. **Cockpit UI**: Adjuster opens dual pane. Reviews property contractor estimate against policy limits.
5. **Line Item Edit**:
   - Adjuster accepts dryout ($3,000) and drywall ($2,500).
   - Adjuster modifies flooring from $4,500 to $3,200 (standard replacement grade per policy clause).
   - Adjuster rejects luxury upgraded fixtures ($2,000) as non-covered betterment.
6. **Recalculation**: Subtotal recalculates from $12,000 to $8,700.
7. **Approval**: Adjuster clicks "Approve Settlement".
8. **Persistence & Verification**:
   - MongoDB verifies modified line items: item 3 adjusted to $3,200, item 4 marked `REJECTED`.
   - Claim status transitions to `APPROVED`.
   - Approved payout recorded as `$8,700 - deductible`.
   - Audit trail stores pre-adjustment and post-adjustment snapshot.

#### Workflow 3: Suspicious Claim Triage to SIU Referral Workflow
1. **Generator**: Synthetic generator creates staged collision claim: conflicting loss date, photos of damage that do not match incident description, duplicate repair invoice number from prior claim, total `$18,500`.
2. **Ingestion**: Ingestion pipeline processes documents.
3. **AI Triage**: LLM flags multiple anomalies:
   - Duplicate invoice ID detected.
   - Severity mismatch between photo and estimate.
   - Fraud Risk Score: `91/100`.
   - Status set to `PENDING_REVIEW` with visual HIGH RISK warning badge.
4. **Cockpit UI**: Adjuster loads claim. Cockpit highlights fraud score in red banner and lists AI-identified fraud indicators.
5. **SIU Referral**:
   - Adjuster selects "Refer to Special Investigation Unit (SIU)".
   - Enters required rationale: "Damage patterns inconsistent with collision report; duplicate invoice flagged by triage."
   - Submits referral.
6. **Persistence & Verification**:
   - Status transitions to `REFERRED_TO_SIU` in MongoDB.
   - Payout approval strictly disabled.
   - Executive Dashboard increments `referredToSiuCount`.
   - Fraud alert notification dispatched to SIU investigator queue.

#### Workflow 4: Executive Compliance Audit & Operations Governance Workflow
1. **Seeding**: Test runner seeds 25 historical claims with varying states, adjusters, and fraud scores.
2. **Executive Login**: Risk Manager authenticates and accesses Executive Dashboard.
3. **Metric Verification**:
   - Risk Manager inspects real-time KPI cards: Total Claims, Total Settled, Labor Hours Saved, Straight-Through Eligibility %.
   - Verifies KPIs match mathematical aggregations.
4. **Queue Filter**: Risk Manager filters triage queue by status (`REFERRED_TO_SIU`) and date range.
5. **Audit Inspection**:
   - Risk Manager selects a specific adjudicated claim and opens Audit Log Modal.
   - System displays chronological event chain: Ingested -> Triaged (Score 91) -> Viewed by Adjuster J. Smith -> Referred to SIU.
6. **Export**: Risk Manager triggers CSV export. System streams RFC-4180 compliant CSV file with tamper-evident record hashes.

---

## 4. Automated Test Execution Mechanism & Harness Architecture

### 4.1 Recommended Technology Stack & Test Runners

Depending on whether the core backend implementation is Node.js or Python, the testing harness is designed with native support for both runtimes, utilizing headless, non-interactive execution:

| Role | Node.js Test Stack | Python Test Stack |
|---|---|---|
| **Unit & Integration Runner** | **Vitest** or **Jest** | **Pytest** |
| **HTTP API Assertion** | **Supertest** or **Axios** | **HTTPX** or **Requests** |
| **Database State Testing** | **Mongoose** + **mongodb-memory-server** | **Motor** / **PyMongo** + test DB |
| **Headless UI Testing** | **Playwright Test** (headless Chromium) | **Playwright-Python** (headless) |
| **Synthetic Data CLI** | Node.js (`pdf-lib` / `canvas`) | Python (`reportlab` / `pillow`) |

### 4.2 Database Isolation & State Management Strategy

To satisfy the constraint of testing against a real MongoDB connection without polluting production or shared development data:

1. **Test Database Namespace**:
   All test suites must connect using a dedicated test URI:
   `mongodb://localhost:27017/claims_adjudication_test` (or `MONGODB_TEST_URI`).
2. **In-Memory Zero-Dependency Fallback**:
   If a local standalone MongoDB daemon is not running on the host, the test harness automatically spins up `mongodb-memory-server` during test suite initialization.
3. **Lifecycle Hooks**:
   - `beforeAll`: Connect to test database; apply database indexes.
   - `beforeEach`: Clear transient collections (`claims`, `line_items`, `audit_logs`), leaving seed auth users intact.
   - `afterAll`: Disconnect from database and clean up temporary test files.
4. **Deterministic Seeding Utility**:
   Create a reusable helper module `tests/fixtures/seed_claims.js` (or `.py`):
   ```javascript
   export async function seedClaimsScenario(scenarioName) {
     // seeds exact deterministic records for R4 metrics tests
   }
   ```

### 4.3 LLM Integration Testing Strategy (Live vs Fixtures)

Testing LLM endpoints involves balancing genuine API verification with CI stability and API rate/cost limits:

1. **Dual-Mode Execution**:
   - **Mode A: Live LLM Verification (`test:live-llm`)**:
     Runs when `GEMINI_API_KEY` or `OPENAI_API_KEY` is present in the environment. Submits the synthetic PDF directly to the live model, verifying that real LLM extraction works end-to-end.
   - **Mode B: Deterministic Regression (`test:regression`)**:
     Uses a recorded, valid LLM response fixture matching the exact JSON schema. This guarantees that test suites run fast (< 10 seconds), deterministic, and without network flakes or API token consumption.
2. **Schema Validator Invariant**:
   Both live LLM responses and fixture responses pass through the exact same AJV/Zod/Pydantic schema validator, ensuring that schema drift is immediately detected.

### 4.4 Directory Layout for Test Artifacts & Suites

```
tests/
├── e2e/
│   ├── tier1_feature_coverage/
│   │   ├── r1_auth_rbac.test.js
│   │   ├── r2_ingestion_extraction.test.js
│   │   ├── r3_review_cockpit.test.js
│   │   └── r4_dashboard_metrics.test.js
│   ├── tier2_boundary_corner/
│   │   ├── r1_auth_boundaries.test.js
│   │   ├── r2_ingestion_boundaries.test.js
│   │   ├── r3_cockpit_boundaries.test.js
│   │   └── r4_metrics_boundaries.test.js
│   ├── tier3_pairwise_combinations/
│   │   └── cross_feature_combinations.test.js
│   └── tier4_workflows/
│       ├── workflow1_happy_path.test.js
│       ├── workflow2_line_item_adjustment.test.js
│       ├── workflow3_siu_referral.test.js
│       └── workflow4_executive_audit.test.js
├── fixtures/
│   ├── seed_users.json
│   ├── seed_multi_state_claims.json
│   ├── mock_llm_responses.json
│   └── synthetic/
│       ├── claim_standard_auto.pdf
│       ├── claim_property_water.pdf
│       ├── claim_staged_fraud.pdf
│       ├── damage_photo_bumper.jpg
│       └── damage_photo_water_leak.png
├── helpers/
│   ├── auth_helper.js
│   ├── db_helper.js
│   └── assertion_helper.js
└── scripts/
    ├── generate_synthetic_claims.js
    └── run_e2e_suite.sh (or .bat)
```

---

## 5. Specifications for TEST_INFRA.md and TEST_READY.md

### 5.1 TEST_INFRA.md Specification
`TEST_INFRA.md` will serve as the single source of truth for setting up, configuring, and executing the automated test infrastructure. It will contain:

1. **System Prerequisites**: Node.js/Python version requirements, MongoDB connectivity requirements, and package manager instructions.
2. **Environment Variables**:
   - `PORT`: Service port (default: 5000 / 3000)
   - `MONGODB_URI`: Development DB URI
   - `MONGODB_TEST_URI`: Dedicated test DB URI
   - `JWT_SECRET`: Test JWT signing secret
   - `GEMINI_API_KEY` / `OPENAI_API_KEY`: For live AI extraction tests
3. **Execution Commands**:
   - `npm test` or `pytest`: Run complete test suite.
   - `npm run test:tier1`: Run feature coverage suite.
   - `npm run test:tier2`: Run boundary & corner case suite.
   - `npm run test:tier3`: Run pairwise combination suite.
   - `npm run test:tier4`: Run full real-world workflow suite.
   - `npm run test:ui`: Run headless Playwright UI tests.
   - `npm run generate:synthetic`: Generate synthetic PDF/image test claims.
4. **Assertion Libraries & Reporting**: Details on test reporter output (TAP, JUnit XML, or terminal summary table) and test artifact locations.

### 5.2 TEST_READY.md Specification
`TEST_READY.md` will serve as the verification readiness contract and gate before any milestone is marked complete:

1. **Acceptance Criteria Verification Matrix**:
   A table mapping R1-R4 acceptance criteria to specific test files, line numbers, and pass/fail status.
2. **Execution Log Snapshot**:
   Verbatim CLI execution output proving 100% test pass rate across all tiers.
3. **Audit Log & DB Verification Proof**:
   Direct query outputs demonstrating expected MongoDB document states following test execution.
4. **Sign-off Checklist**:
   - [ ] All Tier 1 tests passing (>= 24 tests)
   - [ ] All Tier 2 tests passing (>= 24 tests)
   - [ ] All Tier 3 tests passing (>= 6 tests)
   - [ ] All Tier 4 workflows passing (4 full scenarios)
   - [ ] Synthetic generator produces valid PDFs & images
   - [ ] MongoDB status transitions verified directly in DB
   - [ ] Zero mock facades in production verification path

---

## 6. Summary of Architectural Recommendations for Implementers

1. **Decouple Ingestion from Review**: The ingestion endpoint must only parse, extract, and assign initial status `PENDING_REVIEW`. It must never calculate final payouts or transition to `APPROVED`.
2. **Immutable Audit Trail**: Ensure the MongoDB claim schema separates `extractedData` (raw output from LLM) from `adjudicatedData` (adjuster modifications), so all changes are auditable.
3. **Mathematical Precision for Metrics**: The dashboard metrics engine must compute `straightThroughEligibilityPercent` and `laborHoursSaved` using deterministic database aggregation pipelines (`$facet` or `$group`) rather than client-side manual approximations.
4. **Zero-Flake Test Harness**: Use isolated test database namespaces or in-memory MongoDB instances, reset collections between tests, and provide deterministic synthetic fixtures for seamless headless execution.
