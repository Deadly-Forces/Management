# ClaimPilot Architecture

## System Components
- Frontend: React 18 + Vite + Tailwind CSS (port 5173)
- Backend: Node.js + Express + MongoDB (port 5000)
- ML Inference: Python FastAPI (port 8001, internal only)

## Data Flow
1. Claimant uploads documents via Frontend
2. Backend stores files via Multer
3. Backend calls ocrService → extractionService
4. Backend calls ML inference server /predict
5. Decision returned and stored in MongoDB
6. Adjuster reviews via Cockpit UI

## ML Pipeline
- Preprocessing: ml/preprocess.py
- Training: ml/train.py
- Inference: ml/inference_server.py (port 8001)
- Model: ml/models/risk_model.pkl

## Security
- JWT authentication on all protected routes
- ML server bound to 127.0.0.1 only
- Internal API key required for ML server calls
