# ClaimPilot — AI Insurance Claims Adjudication

## Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

## Quick Start

### 1. Backend
cd backend && npm install
cp .env.example .env
# Edit .env with your values
npm run dev

### 2. Frontend
cd frontend && npm install
npm run dev

### 3. ML Pipeline
cd ml
pip install -r requirements.txt
python preprocess.py
python train.py
python inference_server.py

## Roles
- Administrator: admin@acme.com
- Adjuster: verifier@acme.com
- Claimant: Register via UI

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, JWT
- ML: Python, FastAPI, scikit-learn, XGBoost
