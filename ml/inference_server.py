"""
ClaimPilot ML Inference Server (FastAPI)
Exposes the trained risk classification model over a secure internal REST endpoint.
"""

import os
import time
import joblib
import pandas as pd
from typing import Optional
from fastapi import FastAPI, HTTPException, Security, status, Header
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
import uvicorn

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", "ml/models/risk_model.pkl")
INTERNAL_KEY = os.getenv("ML_INTERNAL_KEY", "claimpilot-internal-secret-2026")

# Security
api_key_header = APIKeyHeader(name="X-Internal-Key", auto_error=False)

def verify_api_key(x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")):
    if not x_internal_key or x_internal_key != INTERNAL_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing X-Internal-Key header"
        )
    return x_internal_key

app = FastAPI(
    title="ClaimPilot ML Inference Service",
    description="Risk classification and decision triage microservice",
    version="1.0.0"
)

# Global model state
model = None

@app.on_event("startup")
def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at {MODEL_PATH}. Run train_risk_model.py first.")
    model = joblib.load(MODEL_PATH)
    print(f"Loaded Risk Model from {MODEL_PATH} successfully.")

class ClaimFeatures(BaseModel):
    claim_type: str = Field(..., example="AUTO")
    amount_requested: float = Field(..., ge=0.0, example=24500.0)
    doc_confidence_score: float = Field(..., ge=0.0, le=1.0, example=0.92)
    consistency_score: float = Field(..., ge=0.0, le=1.0, example=0.88)
    days_since_incident: int = Field(..., ge=0, example=5)
    has_police_report: int = Field(..., ge=0, le=1, example=1)
    has_medical_cert: int = Field(..., ge=0, le=1, example=0)
    prior_claims_count: int = Field(..., ge=0, example=1)

class PredictionResponse(BaseModel):
    decision: str
    confidence: float
    risk_score: float
    probabilities: dict[str, float]
    latency_ms: float

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": time.time()
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_claim_risk(
    features: ClaimFeatures,
    key: str = Security(verify_api_key)
):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.perf_counter()

    # Build input dataframe matching training feature names
    input_df = pd.DataFrame([{
        "claim_type": features.claim_type,
        "amount_requested": features.amount_requested,
        "doc_confidence_score": features.doc_confidence_score,
        "consistency_score": features.consistency_score,
        "days_since_incident": features.days_since_incident,
        "has_police_report": features.has_police_report,
        "has_medical_cert": features.has_medical_cert,
        "prior_claims_count": features.prior_claims_count
    }])

    # Predict
    classes = model.classes_
    probabilities = model.predict_proba(input_df)[0]
    prob_dict = {str(cls): round(float(prob), 4) for cls, prob in zip(classes, probabilities)}

    decision = str(model.predict(input_df)[0])
    confidence = round(float(prob_dict[decision]), 4)

    # Risk score: 0 (safe) to 100 (high risk)
    # Based on probability of REJECT and ESCALATE
    reject_prob = prob_dict.get("REJECT", 0.0)
    escalate_prob = prob_dict.get("ESCALATE", 0.0)
    risk_score = round((reject_prob * 100.0) + (escalate_prob * 50.0), 2)

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return PredictionResponse(
        decision=decision,
        confidence=confidence,
        risk_score=risk_score,
        probabilities=prob_dict,
        latency_ms=latency_ms
    )

if __name__ == "__main__":
    # Prompt 3 explicitly requires binding to 127.0.0.1 only, not 0.0.0.0
    uvicorn.run(app, host="127.0.0.1", port=8001)
