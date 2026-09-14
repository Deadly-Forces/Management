# ClaimPilot - AI-Powered Automated Insurance Claims Adjudication System

An intelligent, full-stack insurance claims adjudication platform featuring real-time OCR document extraction, NLP entity parsing, machine learning risk classification (APPROVE / REJECT / ESCALATE), human-in-the-loop review cockpits, and strict multi-tenant claimant isolation.

---

## 🛠️ System Architecture & Components

```
┌─────────────────────────────────────────────────────────────────┐
│                       React 18 + Vite Frontend                  │
│   • Applicant Portal (Claimant)       • Review Cockpit (Adjuster)│
│   • Operations Dashboard (Admin)      • Real-time Entity Cards   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ REST API (Bearer JWT)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Backend                    │
│   • Helmet & Rate-Limiter (100/15m)   • Multer (10MB, MIME Check)│
│   • Isolated Claimant Filtering       • Role-Based State Machine│
├─────────────────────────────────┬───────────────────────────────┤
│    ocrService.js (Tesseract.js) │   extractionService.js (Regex)│
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTP POST /predict (X-Internal-Key)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI ML Microservice (Port 8001)            │
│   • Random Forest Classifier (risk_model.pkl, F1: 99.8%)        │
│   • Internal Binding (127.0.0.1 only) • Sub-25ms Latency SLA    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before running the application locally, ensure you have the following installed:
* **Node.js**: v18.0.0+ (Tested on v24.x)
* **npm**: v9.0.0+
* **Python**: v3.10+ (Tested on Python 3.11 / 3.14)
* **MongoDB**: A running MongoDB instance (Local on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

## 🚀 Running Locally

Follow these exact steps to launch the ClaimPilot system locally.

### Step 1: Clone & Configure Environment Variables
Copy `.env.example` in both root and `backend/`:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Ensure `backend/.env` contains:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/claimpilot
JWT_SECRET=claimpilot_supersecret_jwt_key_2026_production_min32chars
ML_SERVICE_URL=http://127.0.0.1:8001
ML_INTERNAL_KEY=claimpilot-internal-secret-2026
DEMO_ADMIN_EMAIL=admin@acme.com
DEMO_ADMIN_PASSWORD=password123
DEMO_VERIFIER_EMAIL=verifier@acme.com
DEMO_VERIFIER_PASSWORD=password123
```

---

### Step 2: Set Up and Start Python ML Microservice
Open Terminal 1:
```bash
# Navigate to ml directory
cd ml

# Create and activate Python virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate synthetic claims dataset (2500 samples, calibrated distribution)
python generate_synthetic_data.py
# Expected Output:
# Generated 2500 synthetic claim records.
# APPROVE: 60.0%, REJECT: 25.0%, ESCALATE: 15.0%

# Train the Random Forest risk scoring model
python train_risk_model.py
# Expected Output:
# Weighted F1 Score: 0.9980 (Target: > 0.80)
# Trained risk model successfully saved to ml/models/risk_model.pkl

# Start the secure FastAPI inference server
python inference_server.py
```
**Expected Output:**
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
Loaded Risk Model from ml/models/risk_model.pkl successfully.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
```

---

### Step 3: Set Up and Start Backend Server
Open Terminal 2:
```bash
cd backend
npm install
npm run dev
```
**Expected Output:**
```
MongoDB Connected: ...
[Seed] Seeded Admin (admin@acme.com) and Verifier (verifier@acme.com)
Server running on port 5000
```

---

### Step 4: Set Up and Start Frontend Client
Open Terminal 3:
```bash
cd frontend
npm install
npm run dev
```
**Expected Output:**
```
VITE v8.2.2  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open `http://localhost:5173` in your browser.

---

## 🐳 Running with Docker Compose

To launch all four microservices (Frontend, Backend, ML, MongoDB) in an isolated container network with built-in health checks:

```bash
docker-compose up --build
```
* **Frontend UI**: `http://localhost:80`
* **Backend API**: `http://localhost:5000`
* **ML Inference**: `http://127.0.0.1:8001` (Internal binding)
* **MongoDB**: `localhost:27017`

---

## 🧪 Running Automated Tests

To execute the Jest + Supertest end-to-end integration and resilience test suite:
```bash
cd backend
npm test
```
The test suite validates:
1. `POST /api/demo/login` -> 200 OK + JWT token generation.
2. `POST /api/demo/claims/submit` with OCR & ML inference -> status transitions out of `DOCUMENTS_PROCESSING` within SLA.
3. Corrupted PDF upload -> asserts 400 Bad Request (no 500 crash).
4. Blank description submission -> asserts 400 Bad Request.
5. Claimant isolation -> asserts Claimants cannot inspect each other's claims.
6. ML server downtime resilience -> asserts graceful fallback with `MANUAL_REVIEW_REQUIRED`.

---

## 🔒 Security & Privacy Implementations

1. **Strict Multi-Tenant & Claimant Isolation**: Claims are queried using `{ claimantId: req.user._id, tenantId: req.tenantId }`. Zero reliance on hardcoded admin accounts.
2. **Hardened Upload Pipeline**: Multer validates file magic numbers and MIME types (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`). Enforces a strict 10MB ceiling.
3. **Internal Microservice Protection**: The ML inference service binds strictly to `127.0.0.1` and requires an `X-Internal-Key` header on every call.
4. **Data Sovereignty & Privacy**: Uses local `Tesseract.js` + `Sharp` preprocessing, avoiding external cloud data egress for sensitive identity cards (Aadhaar, Death Certificates).
5. **Sanitized Git History**: All sensitive test identity images and credentials have been permanently purged from git commit history via `git-filter-repo`.
