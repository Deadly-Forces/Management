# Comprehensive Survey & Architectural Specification
## Automated Insurance Claims Adjudication System (R1 – R4)

**Prepared by**: Explorer 1 (Requirement & Architecture Explorer)  
**Agent ID**: `teamwork_preview_explorer_survey_1`  
**Date**: 2026-09-03  
**Status**: Complete  

---

## 1. Executive Summary & Scope Overview

The objective of this project is to build an enterprise-grade, automated insurance claims adjudication system. The system balances autonomous AI document and image intelligence with mandatory human-in-the-loop oversight to enforce fraud risk containment, policy compliance, and audit transparency.

### Core Pillars
1. **R1: Role-Based Access & Secure Auth**: JWT-authenticated security layer enforcing strict separation among three pre-seeded roles: `Adjuster`, `Risk Manager`, and `Policyholder`, backed by a live MongoDB database.
2. **R2: Automated Triage & Extraction Engine**: Ingestion pipeline for insurance claim documents (PDFs) and damage photos (images), powered by a real LLM API (Gemini/OpenAI) to extract structured policy matching, line-item repair/medical costs, calculate a 0–100 fraud risk score, and generate draft settlements. Supported by a standalone synthetic claim data generator for test PDFs and images.
3. **R3: Adjuster Review Cockpit**: A dual-pane human-in-the-loop interface pairing original evidence (PDF viewer, photo inspector) with extracted adjudication line items, allowing adjusters to accept, reject, or modify line costs, and explicitly trigger either **Approve Settlement** or **Refer to SIU** (with a strict constraint: **no automated payouts**).
4. **R4: Carrier Executive & Operations Dashboard**: Real-time operations analytics displaying financial metrics, triage queue management, exportable audit trail (JSON/CSV), and key operational KPIs including **Labor Hours Saved** and **Straight-Through Eligibility %**.

---

## 2. Requirements Decomposition & Boundary Analysis

### R1. Role-Based Access & Secure Auth

#### 2.1 Role Definitions & Permissions Matrix
| Role | Allowed Access & Operations | Prohibited Access (Returns 403 Forbidden) |
|---|---|---|
| **Adjuster** | - Access Adjuster Review Cockpit<br>- View and search claim triage queue<br>- View claim evidence documents & photos<br>- Edit/accept/reject claim line items<br>- Approve settlements (`UNDER_REVIEW` → `APPROVED`)<br>- Refer claims to SIU (`UNDER_REVIEW` → `REFERRED_TO_SIU`)<br>- Add adjuster notes & inspection memos | - Modify global risk policy thresholds<br>- Delete audit logs<br>- Impersonate other users |
| **Risk Manager** | - Access Carrier Executive & Operations Dashboard<br>- View real-time financial & velocity metrics<br>- View triage queue & filter by fraud score/risk tier<br>- Review SIU referrals and high-risk claims<br>- Export immutable audit logs (JSON/CSV)<br>- View straight-through eligibility & labor hours saved | - Policyholder-only claim creation interface (unless authorized as admin)<br>- Direct payout disbursement bypassing adjuster review |
| **Policyholder** | - Submit new claims with uploaded PDF/photo evidence<br>- View own submitted claims & real-time status<br>- View final approved settlement summary & explanation of benefits | - **Adjuster Review Cockpit**<br>- **Carrier Executive Dashboard**<br>- **Internal fraud risk scores & risk indicators**<br>- **Line-item modification endpoints**<br>- **Settlement approval / SIU referral endpoints**<br>- **Viewing claims of other policyholders** |

#### 2.2 Authentication & Security Mechanisms
- **JWT Authentication**:
  - Signed using HS256 with `JWT_SECRET` stored in environment variables.
  - Token payload includes: `{ userId, email, role, exp, iat }`. Standard expiration set to 24 hours.
  - Tokens transmitted via standard HTTP header: `Authorization: Bearer <token>`.
- **Password Security**:
  - Passwords hashed using `bcrypt` (10 salt rounds) before persistence.
  - Passwords never returned in user queries or API responses (`select: false` in Mongoose).
- **Database Connection**:
  - Real MongoDB connection using Mongoose (`MONGODB_URI`).
  - Connection pooling with automatic reconnection and graceful teardown.
- **Pre-seeded Accounts**:
  - `adjuster@carrier.com` / `Adjuster123!` (Role: `Adjuster`)
  - `riskmanager@carrier.com` / `RiskManager123!` (Role: `Risk Manager`)
  - `policyholder@carrier.com` / `Policyholder123!` (Role: `Policyholder`)
  - Seed routine runs automatically on startup if database users collection is empty.

---

### R2. Automated Triage & Extraction Engine

#### 2.1 Ingestion Pipeline
- Supports `multipart/form-data` uploads:
  - Form fields: `policyNumber`, `incidentDate`, `incidentDescription`, `claimType` (Auto, Property, Health/Injury).
  - Attached files: PDFs (repair estimates, invoices, medical bills, police reports) and Images (JPEG, PNG, WEBP damage photos).
- Files validated for size (<25MB) and MIME type. Files stored securely in local volume (`/uploads/claims/<claimId>/`) or object store, with URI references stored in MongoDB.

#### 2.2 Real LLM API Integration (Gemini / OpenAI)
- Model integration calls real Gemini API (via `@google/genai` or `@google/generative-ai` with `GEMINI_API_KEY`) or OpenAI API (via `openai` with `OPENAI_API_KEY`).
- Pipeline tasks performed by LLM:
  1. **Policy Matching**: Cross-references claimed incident details and items against policy terms:
     - Verifies policy validity at incident date.
     - Maps items to coverage categories (Collision, Comprehensive, Liability).
     - Identifies policy deductible and policy maximum limit.
  2. **Itemized Cost Extraction**: Extracts itemized line items from invoices/estimates:
     - `category`: `Parts`, `Labor`, `Materials`, `Diagnostic`, `Medical`, `Sublet`.
     - `description`: Text descriptor of part/labor.
     - `claimedAmount`: Extracted dollar amount.
     - `aiSuggestedAmount`: AI baseline verification against prevailing labor/parts rates.
     - `confidence`: 0.0 to 1.0 confidence score.
  3. **Fraud Risk Assessment & Scoring (0–100)**:
     - Generates an integer score from 0 (completely benign) to 100 (definite fraud pattern).
     - Assigns **Fraud Risk Tier**:
       - `LOW` (0 – 30): Clean claim, eligible for straight-through review recommendation.
       - `MEDIUM` (31 – 70): Standard claim with minor rate variations or standard documentation gaps.
       - `HIGH` (71 – 100): High risk (e.g., duplicated invoice lines, inflated labor hours, inconsistent damage narrative vs photos, altered document timestamps).
     - Returns specific `fraudIndicators`: array of structured risk flags with description and severity.
  4. **Draft Settlement Calculation**:
     - Gross claimed total = $\sum \text{claimedAmount}$.
     - AI suggested subtotal = $\sum \text{aiSuggestedAmount}$.
     - Net draft settlement = $\max(0, \text{AI suggested subtotal} - \text{policyDeductible})$, capped at `coverageLimit`.
     - Synthesizes clear settlement rationale explaining deductions.

#### 2.3 Synthetic Claim Data Generator
- Standalone generation script (`scripts/generate_synthetic.js` or `.py`):
  - **PDF Generation**: Generates realistic multi-line PDF repair estimates (auto repair shop layout, VIN, labor hours, OEM part numbers, totals) and medical/hospital bills using `pdfkit` or `pdf-lib`.
  - **Damage Photo Generation**: Generates synthetic vehicle/property damage images with simulated impact textures, timestamps, watermark tags, and EXIF metadata.
  - **Scenario Suites**:
    - *Scenario 1: Clean Low-Risk Auto Claim* (Front bumper scratch, OEM replacement, valid dates, fraud score 10–20).
    - *Scenario 2: Medium-Risk Split Invoice* (Elevated labor rates, minor mismatch, fraud score 45–55).
    - *Scenario 3: High-Risk Suspected Fraud* (Exorbitant sublet fee, duplicated invoice numbers, incompatible damage pattern, fraud score 85–95).

---

### R3. Adjuster Review Cockpit

#### 3.1 Dual-Pane User Interface Layout
```
+---------------------------------------------------------------------------------------------------+
| HEADER: Claim #CLM-2026-0042  |  Policyholder: John Doe  |  Status: UNDER_REVIEW  | Risk: HIGH (82) |
+--------------------------------------------------+------------------------------------------------+
| LEFT PANE: Original Evidence (50%)              | RIGHT PANE: Extracted Data & Adjudication (50%)|
|--------------------------------------------------|------------------------------------------------|
| [PDF Estimates]  [Damage Photos]  [Police Report]| [Policy Match] Active | Deductible: $500       |
|                                                  |------------------------------------------------|
| +----------------------------------------------+ | [AI FRAUD SCORE]: 82/100 [HIGH RISK TIER]       |
| |                                              | | Flags:                                         |
| |   AUTO BODY SHOP ESTIMATE                    | | - Duplicate part #8821 claimed twice ($420)     |
| |   Date: 2026-08-12  VIN: 1HGCR2F83...        | | - Labor rate $185/hr exceeds regional standard |
| |                                              | |------------------------------------------------|
| |   Line 1: Front Bumper Cover   $450.00       | | ADJUDICATION TABLE:                            |
| |   Line 2: Paint Labor (3.5h)   $420.00       | | Item | Claimed | AI Rec | Adj ($) | Action     |
| |   Line 3: Headlamp Assembly    $320.00       | | Bumper| $450   | $450   | [ 450 ] | [V] Acc [X]|
| |                                              | | Paint | $420   | $280   | [ 280 ] | [V] Acc [X]|
| | [Page 1/2] [Zoom + / -] [Download Original]   | | Lamp  | $320   | $0     | [   0 ] | [ ] Acc [X]|
| +----------------------------------------------+ |------------------------------------------------|
| [Photos Carousel: front_dent.jpg, tire.jpg]      | Subtotal: $730.00  | Deductible: -$500.00      |
|                                                  | Net Approved Payout: $230.00                   |
+--------------------------------------------------+------------------------------------------------+
| FOOTER DECISION ACTIONS (Human-in-the-Loop):                                                      |
|   [!] Refer to SIU (Fraud Suspicion)             [OK] Approve Settlement ($230.00)                |
|   * Strict Policy: No automated payouts. Human review signature required.                         |
+---------------------------------------------------------------------------------------------------+
```

#### 3.2 Human-in-the-Loop Adjudication Controls
- **Line Item Operations**:
  - Accept / Reject toggles for each line item.
  - Editable `adjustedAmount` field allowing adjuster to override claimed or suggested amounts.
  - Per-item adjuster notes input.
  - Automatic recalculation of Subtotal, Deductible subtraction, and Net Settlement in real time.
- **Explicit Adjudication Actions**:
  1. **"Approve Settlement"**:
     - Transitions claim status: `UNDER_REVIEW` → `APPROVED`.
     - Commits final settlement breakdown (`totalClaimed`, `totalApproved`, `deductibleApplied`, `netSettlement`).
     - Logs `SETTLEMENT_APPROVED` event with adjuster ID and full delta to `AuditLog`.
  2. **"Refer to SIU"**:
     - Transitions claim status: `UNDER_REVIEW` → `REFERRED_TO_SIU`.
     - Opens mandatory modal requiring `siuReferralReason` and supporting notes.
     - Flags claim for Special Investigation Unit in the Risk Manager queue.
     - Logs `CLAIM_REFERRED_TO_SIU` to `AuditLog`.
- **Constraint Enforcement**: No API route or background cron dispatches payment automatically. Payouts require explicit Adjuster authorization.

---

### R4. Carrier Executive & Operations Dashboard

#### 4.1 Real-Time Financial & Velocity Metrics
- **Financial Aggregates**:
  - Total Volume Ingested ($) vs Total Approved Settlement ($).
  - Total Carrier Savings ($) = $\sum (\text{totalClaimed} - \text{totalApproved})$.
  - Average Settlement per Approved Claim ($).
- **KPI: "Labor Hours Saved"**:
  - Industry benchmark baseline for manual unassisted claim review = **2.5 hours** per claim.
  - Actual assisted adjudication time = recorded review duration (or average 0.4 hours with AI triage).
  - Aggregated formula:
    $$\text{Labor Hours Saved} = \sum_{\text{adjudicated claims}} (\text{Baseline Hours (2.5h)} - \text{Actual Review Hours})$$
    *(Or parametric: $\text{Count}(\text{Adjudicated Claims}) \times 2.1\text{ hours saved per claim}$)*.
- **KPI: "Straight-Through Eligibility %"**:
  - Defined as the percentage of all ingested claims that meet criteria for automated/low-friction settlement:
    - AI Fraud Score < 25 (Low Risk)
    - Valid active policy match with zero coverage discrepancies
    - Total claimed amount $\le$ Policy coverage limit
    - No duplicate or suspicious line items
  - Formula:
    $$\text{Straight-Through Eligibility \%} = \left( \frac{\text{Count}(\text{Eligible Claims})}{\text{Total Ingested Claims}} \right) \times 100$$

#### 4.2 Filterable Triage Queue
- Real-time tabular queue displaying:
  - Columns: Claim ID, Policyholder, Claim Type, Ingestion Date, Claimed ($), Fraud Risk Score (Color-coded badge: Green 0–30, Yellow 31–70, Red 71–100), Status Badge, Assigned Adjuster, Action Link ("Review").
  - Multi-criteria filters:
    - Status (`ALL`, `NEW`, `TRIAGED`, `UNDER_REVIEW`, `APPROVED`, `REFERRED_TO_SIU`, `REJECTED`).
    - Fraud Risk Tier (`ALL`, `LOW`, `MEDIUM`, `HIGH`).
    - Date range picker.
    - Amount range sliders.
    - Free-text search (Claim ID, Policyholder name, VIN).
  - Column sorting (by Fraud Score descending, Date descending, Claimed Amount).

#### 4.3 Exportable Audit Log
- Records every state mutation, extraction event, and user action:
  - Timestamp (ISO 8601 UTC)
  - Claim ID / Claim Number
  - Actor: User ID, Name, Role (or `SYSTEM_AI_ENGINE`)
  - Action Type: `CLAIM_SUBMITTED`, `AI_TRIAGE_COMPLETED`, `LINE_ITEM_MODIFIED`, `SETTLEMENT_APPROVED`, `REFERRED_TO_SIU`, `LOGIN_ATTEMPT`.
  - Details: JSON diff showing previous state vs updated state, adjustment notes.
- Export Formats:
  - `GET /api/dashboard/audit-logs?format=csv` → Direct streaming RFC 4180 CSV download.
  - `GET /api/dashboard/audit-logs?format=json` → Pretty-printed structured JSON download.

---

## 3. Acceptance Criteria & Verification Mapping

| Req | Acceptance Criterion | Verification Method & Test Assertion |
|---|---|---|
| **R1** | Test authenticates as Adjuster and Policyholder | `POST /api/auth/login` returns 200 OK with valid JWT tokens for both pre-seeded accounts. |
| **R1** | Policyholder token rejected (403 Forbidden) on Adjuster-only endpoints | `GET /api/dashboard/metrics` and `POST /api/claims/:id/approve` with Policyholder Bearer token assert HTTP status `403 Forbidden` and error code `FORBIDDEN_ROLE`. |
| **R2** | Synthetic data generation script creates sample PDF claims and image files | `node scripts/generate_synthetic.js` exits with code 0, generating valid PDF estimate (`.pdf`) and vehicle damage photo (`.jpg`/`.png`) in fixtures directory; file sizes > 0 and valid headers confirmed. |
| **R2** | Ingestion endpoint accepts synthetic files and returns structured JSON with itemized costs & 0–100 fraud score | `POST /api/claims/ingest` with multipart synthetic files returns 201 Created. Response JSON asserts: `lineItems.length >= 1`, `typeof aiTriage.fraudScore === 'number'`, `fraudScore >= 0 && fraudScore <= 100`, `fraudRiskTier in ['LOW', 'MEDIUM', 'HIGH']`. |
| **R3** | Database state transitions correctly on "Approve Settlement" | `POST /api/claims/:id/approve` transitions claim `status` in MongoDB to `'APPROVED'`, sets `financials.totalApproved` and `adjudication.decision = 'APPROVED'`. |
| **R3** | Database state transitions correctly on "Refer to SIU" | `POST /api/claims/:id/refer-siu` with referral reason transitions claim `status` in MongoDB to `'REFERRED_TO_SIU'`. |
| **R3** | Individual line items can be modified before approval | `PATCH /api/claims/:id/line-items/:itemId` updates `status` to `'ACCEPTED'`/`'REJECTED'` and overrides `adjustedAmount`. Approved settlement reflects the adjusted sum. |
| **R4** | Dashboard metrics accurately calculate "Labor Hours Saved" | Database seeded with multiple claims. `GET /api/dashboard/metrics` returns `laborHoursSaved` exactly matching mathematical expectation of aggregate adjudicated claims. |
| **R4** | Dashboard metrics accurately calculate "Straight-Through Eligibility %" | `GET /api/dashboard/metrics` returns `straightThroughEligibilityRate` equal to `(eligible_claims / total_claims) * 100` rounded to 1 decimal place. |

---

## 4. System Architecture & Tech Stack Recommendation

### 4.1 Stack Tradeoff Analysis

```
+------------------------------------+------------------------------------+
| OPTION A: Node.js / Express + Vite | OPTION B: Python / FastAPI + Vite  |
+------------------------------------+------------------------------------+
| PROS:                              | PROS:                              |
| - Single language across stack     | - High-performance async runtime  |
| - First-class Mongoose ORM/ODM     | - Pydantic type validation & docs  |
| - Native Google GenAI & OpenAI SDK | - Native ReportLab & Pillow libs   |
| - Lightweight, zero-config startup |                                    |
| - Fast test runners (Jest/Vitest)  | CONS:                              |
|                                    | - Dual runtime (Node + Python venv)|
| CONS:                              | - PyMongo/Motor ORM less standard  |
| - Heavy PDF/OCR libraries in C++   | - More complex multi-process dev   |
|   (resolved via pure JS `pdf-lib`) |                                    |
+------------------------------------+------------------------------------+
```

### 4.2 Definitive Recommendation: Node.js / Express + React (Vite) + Tailwind CSS
**Rationale**:
1. **Single Runtime Simplicity**: Eliminates cross-language packaging overhead on Windows systems. A single `npm install` handles both server and client dependencies.
2. **First-Class MongoDB Integration**: `mongoose` provides robust schema validation, middleware hooks (for automatic audit logging), and aggregation pipeline tooling.
3. **Pure-JavaScript PDF & Image Tooling**: `pdf-lib` and `pdfkit` generate realistic multi-page PDF repair estimates with zero native binary compilation requirements on Windows. Image manipulation and synthetic visual generation are handled via pure JavaScript canvas/buffers.
4. **Official LLM SDKs**: `@google/genai` (or `@google/generative-ai`) and `openai` provide streaming, multimodal document ingestion (uploading PDFs/images directly as inline data/parts to Gemini 1.5 Flash/Pro).

### 4.3 System Architecture Diagram
```
                       +-----------------------------------+
                       |        Client Web Browser         |
                       | (React 18 + Vite + Tailwind CSS)  |
                       +-----------------+-----------------+
                                         |
                       HTTPS / REST APIs | Bearer JWT
                                         v
+---------------------------------------------------------------------------+
|                          Node.js / Express Server                         |
|                                                                           |
|  +---------------------+  +---------------------+  +--------------------+ |
|  |  Auth Middleware    |  |   RBAC Middleware   |  | Multer File Upload | |
|  |  (JWT Verification) |  | (Adjuster/Risk/PH)  |  | (PDF/Image parsing)| |
|  +----------+----------+  +----------+----------+  +---------+----------+ |
|             |                        |                       |            |
|             v                        v                       v            |
|  +----------------------------------------------------------------------+ |
|  |                        Controllers / Business Logic                  | |
|  |   AuthController | ClaimsController | DashboardController | AuditLog | |
|  +----------+------------------------+-----------------------+----------+ |
|             |                        |                       |            |
|             v                        v                       v            |
|  +---------------------+  +---------------------+  +--------------------+ |
|  |   Mongoose Models   |  | AI Triage Engine    |  | Synthetic Engine   | |
|  | User, Claim, Policy |  | Google Gemini /     |  | pdf-lib / Canvas   | |
|  | AuditLog            |  | OpenAI SDK          |  | PDF & Photo Gen    | |
|  +----------+----------+  +----------+----------+  +--------------------+ |
+-------------|------------------------|------------------------------------+
              |                        |
              v                        v
+--------------------------+  +---------------------------------------------+
|    MongoDB Database      |  | External AI Provider:                       |
|   (Claims, Users,        |  | Google Gemini 1.5 Pro / Flash API or OpenAI |
|    Policies, AuditLogs)  |  +---------------------------------------------+
+--------------------------+
```

---

## 5. MongoDB Data Schemas & Models

### 5.1 User Model (`User.js`)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['Adjuster', 'Risk Manager', 'Policyholder'], 
    required: true, 
    index: true 
  },
  createdAt: { type: Date, default: Date.now }
});
```

### 5.2 Policy Model (`Policy.js`)
```javascript
const policySchema = new mongoose.Schema({
  policyNumber: { type: String, required: true, unique: true, index: true },
  policyholderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverageType: { 
    type: String, 
    enum: ['Auto Comprehensive & Collision', 'Commercial Property', 'General Liability'],
    required: true 
  },
  effectiveDate: { type: Date, required: true },
  expirationDate: { type: Date, required: true },
  deductible: { type: Number, required: true, default: 500 },
  coverageLimit: { type: Number, required: true, default: 50000 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED'], default: 'ACTIVE' }
});
```

### 5.3 Claim Model (`Claim.js`)
```javascript
const lineItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Parts', 'Labor', 'Materials', 'Diagnostic', 'Medical', 'Sublet'],
    required: true 
  },
  description: { type: String, required: true },
  claimedAmount: { type: Number, required: true },
  aiSuggestedAmount: { type: Number, required: true },
  adjustedAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'], 
    default: 'PENDING' 
  },
  adjusterNotes: { type: String, default: '' }
});

const claimSchema = new mongoose.Schema({
  claimNumber: { type: String, required: true, unique: true, index: true },
  policyNumber: { type: String, required: true, index: true },
  policyholderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  incidentDate: { type: Date, required: true },
  incidentDescription: { type: String, required: true },
  claimType: { type: String, enum: ['Auto', 'Property', 'Injury'], default: 'Auto' },
  status: { 
    type: String, 
    enum: ['NEW', 'TRIAGED', 'UNDER_REVIEW', 'APPROVED', 'REFERRED_TO_SIU', 'REJECTED'], 
    default: 'NEW',
    index: true 
  },
  documents: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  aiTriage: {
    processedAt: Date,
    modelUsed: String,
    policyMatched: Boolean,
    fraudScore: { type: Number, min: 0, max: 100, index: true },
    fraudRiskTier: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], index: true },
    fraudIndicators: [{
      flag: String,
      confidence: Number,
      description: String
    }],
    straightThroughEligible: { type: Boolean, default: false, index: true },
    draftSettlementRationale: String
  },
  lineItems: [lineItemSchema],
  financials: {
    totalClaimed: { type: Number, default: 0 },
    totalApproved: { type: Number, default: 0 },
    deductibleApplied: { type: Number, default: 0 },
    netSettlement: { type: Number, default: 0 }
  },
  adjudication: {
    adjudicatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adjudicatedAt: Date,
    decision: { type: String, enum: ['APPROVED', 'REFERRED_TO_SIU', 'REJECTED'] },
    decisionNotes: String,
    siuReferralReason: String,
    reviewDurationMinutes: { type: Number, default: 24 }
  },
  createdAt: { type: Date, default: Date.now, index: true }
});
```

### 5.4 AuditLog Model (`AuditLog.js`)
```javascript
const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', index: true },
  claimNumber: { type: String },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName: { type: String, required: true },
  actorRole: { 
    type: String, 
    enum: ['Adjuster', 'Risk Manager', 'Policyholder', 'SYSTEM_AI_ENGINE'], 
    required: true 
  },
  action: { 
    type: String, 
    enum: [
      'USER_LOGIN',
      'CLAIM_SUBMITTED',
      'AI_TRIAGE_COMPLETED',
      'LINE_ITEM_MODIFIED',
      'SETTLEMENT_APPROVED',
      'CLAIM_REFERRED_TO_SIU',
      'CLAIM_REJECTED',
      'AUDIT_LOG_EXPORTED'
    ],
    required: true,
    index: true
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, default: '127.0.0.1' }
});
```

---

## 6. REST API Endpoints Specification

### 6.1 Authentication Routes (`/api/auth`)
| Method | Endpoint | Allowed Roles | Description | Response Status |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate with email & password, returns JWT token and user info | 200 OK / 401 Unauthorized |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile | 200 OK / 401 Unauthorized |
| `POST` | `/api/auth/seed` | Public / Dev | Reseed pre-configured test users and sample policies | 200 OK |

### 6.2 Claims & Ingestion Routes (`/api/claims`)
| Method | Endpoint | Allowed Roles | Description | Response Status |
|---|---|---|---|---|
| `POST` | `/api/claims/ingest` | Policyholder, Adjuster | Upload PDF/photos, execute AI extraction pipeline, create claim | 201 Created / 400 Bad Request |
| `GET` | `/api/claims` | All (Filtered) | List claims (Policyholder: own claims; Adjuster/Risk: all with filters) | 200 OK |
| `GET` | `/api/claims/:id` | All (Scoped) | Get single claim with documents, line items, and triage data | 200 OK / 403 Forbidden / 404 |
| `PATCH` | `/api/claims/:id/line-items/:itemId` | Adjuster | Update line item status (`ACCEPTED`/`REJECTED`), edit amount & notes | 200 OK / 403 Forbidden |
| `POST` | `/api/claims/:id/approve` | Adjuster | Explicitly approve settlement and transition claim to `APPROVED` | 200 OK / 400 Bad Request / 403 |
| `POST` | `/api/claims/:id/refer-siu` | Adjuster | Refer claim to SIU with mandatory rationale, sets `REFERRED_TO_SIU` | 200 OK / 400 Bad Request / 403 |

### 6.3 Executive Dashboard Routes (`/api/dashboard`)
| Method | Endpoint | Allowed Roles | Description | Response Status |
|---|---|---|---|---|
| `GET` | `/api/dashboard/metrics` | Risk Manager, Adjuster | Get real-time KPIs: financial metrics, Labor Hours Saved, STP % | 200 OK / 403 Forbidden |
| `GET` | `/api/dashboard/queue` | Risk Manager, Adjuster | Filterable & paginated triage queue with sort and search | 200 OK / 403 Forbidden |
| `GET` | `/api/dashboard/audit-logs` | Risk Manager | Export system audit log in JSON or CSV format | 200 OK / 403 Forbidden |

### 6.4 Synthetic Data Routes (`/api/synthetic`)
| Method | Endpoint | Allowed Roles | Description | Response Status |
|---|---|---|---|---|
| `POST` | `/api/synthetic/generate` | Adjuster, Risk Manager | Generate sample synthetic PDF claim and damage photo files | 200 OK / 500 Internal Error |

---

## 7. Mathematical Formulations for Core Metrics

### 7.1 "Labor Hours Saved" Formula
For any adjudicated claim $i \in C_{\text{adjudicated}}$:
- Baseline manual adjudication duration: $T_{\text{manual}} = 2.5\text{ hours}$ (standard industry adjuster time without AI triage).
- Actual review duration: $T_{\text{review}, i} = \frac{\text{claim.adjudication.reviewDurationMinutes}_i}{60}$.
- If actual duration is unrecorded, defaulted assisted duration: $T_{\text{assisted}} = 0.4\text{ hours}$.
- **Aggregate Formula**:
  $$\text{Labor Hours Saved} = \sum_{i=1}^{N_{\text{adjudicated}}} \left( 2.5 - T_{\text{review}, i} \right)$$
  *(Example: For 10 approved/SIU claims averaging 24 minutes review: $10 \times (2.5 - 0.4) = 21.0\text{ hours saved}$.)*

### 7.2 "Straight-Through Eligibility %" Formula
Let $C$ be the set of all claims ingested into the system ($N_{\text{total}} = |C|$).  
A claim $c \in C$ is defined as **Straight-Through Eligible** ($E(c) = 1$) if and only if:
1. $c.\text{aiTriage}.\text{fraudScore} < 25$ (Low Risk Tier)
2. $c.\text{aiTriage}.\text{policyMatched} = \text{true}$
3. $c.\text{financials}.\text{totalClaimed} \le \text{policy}.\text{coverageLimit}$
4. $\text{Count}(c.\text{aiTriage}.\text{fraudIndicators}) = 0$

$$\text{Straight-Through Eligibility \%} = \left( \frac{\sum_{c \in C} E(c)}{N_{\text{total}}} \right) \times 100$$
*(Example: Out of 20 ingested claims, 7 qualify under low-risk criteria: $\frac{7}{20} \times 100 = 35.0\%$.)*

---

## 8. Directory Layout & Implementation Plan

```
d:\sih\
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB Mongoose connection
│   │   │   ├── jwt.js                # JWT signing & secret verification
│   │   │   └── llm.js                # Gemini / OpenAI SDK initialization
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, me, seed
│   │   │   ├── claimsController.js   # Ingestion, get, line-items, approve, SIU
│   │   │   └── dashboardController.js# Metrics, queue, audit log export
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT bearer verification
│   │   │   ├── rbac.js               # Role-based route guard
│   │   │   └── upload.js             # Multer PDF/image file parser
│   │   ├── models/
│   │   │   ├── User.js               # User schema
│   │   │   ├── Policy.js             # Policy schema
│   │   │   ├── Claim.js              # Claim schema & line items
│   │   │   └── AuditLog.js           # Immutable audit log schema
│   │   ├── services/
│   │   │   ├── llmTriageService.js   # LLM extraction & fraud scoring
│   │   │   ├── metricsService.js     # Labor hours saved & STP % calculations
│   │   │   └── auditService.js       # Structured event audit logger
│   │   └── server.js                 # Express app entrypoint
│   ├── scripts/
│   │   ├── seed.js                   # Pre-seed users & policies
│   │   └── generate_synthetic.js     # Synthetic PDF/image generator
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Role-aware navigation & user profile
│   │   │   ├── DocumentViewer.jsx    # Dual-pane PDF previewer
│   │   │   ├── PhotoGallery.jsx      # High-res photo & damage inspector
│   │   │   ├── LineItemEditor.jsx    # Interactive accept/reject table
│   │   │   ├── MetricsCard.jsx       # Financial & velocity KPI cards
│   │   │   └── SiuModal.jsx          # Mandatory SIU referral modal
│   │   ├── views/
│   │   │   ├── LoginView.jsx         # Role selection & login form
│   │   │   ├── AdjusterCockpit.jsx   # Dual-pane adjudication interface
│   │   │   ├── ExecutiveDashboard.jsx# Executive metrics, queue, audit export
│   │   │   └── PolicyholderPortal.jsx# Claim upload & status tracker
│   │   ├── services/
│   │   │   └── api.js                # Axios HTTP client with JWT interceptor
│   │   ├── App.jsx                   # Role-based route protector
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── tests/
    ├── e2e/
    │   ├── r1_auth_rbac.test.js      # Role-based authentication tests
    │   ├── r2_ai_ingestion.test.js   # Synthetic generation & triage tests
    │   ├── r3_review_cockpit.test.js # Line item edit & status transition tests
    │   └── r4_dashboard_metrics.test.js # Financial, labor hours & STP tests
    └── package.json
```

---

## 9. Next Steps for Implementation Orchestrator

1. **Phase 1: Foundation (R1)**:
   - Scaffold backend structure, install dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `multer`).
   - Implement `User`, `Policy`, `AuditLog` schemas, JWT middleware, and pre-seed script.
   - Run verification test for R1.
2. **Phase 2: AI Triage & Synthetic Data Pipeline (R2)**:
   - Implement synthetic generator script for PDF estimates and damage photos.
   - Configure LLM service with fallback handling to extract line items and compute 0–100 fraud risk score.
   - Run verification test for R2.
3. **Phase 3: Review Cockpit & Adjudication Logic (R3)**:
   - Implement claim line item update, settlement approval, and SIU referral endpoints.
   - Build dual-pane Adjuster Review Cockpit with interactive line-item controls and document viewer.
   - Run verification test for R3.
4. **Phase 4: Executive Dashboard & Operations Metrics (R4)**:
   - Implement metrics calculation service (Labor Hours Saved, Straight-Through Eligibility %).
   - Implement filterable triage queue and audit log CSV/JSON export.
   - Build Executive Dashboard UI.
   - Run verification test for R4 and final full-system E2E test suite.
