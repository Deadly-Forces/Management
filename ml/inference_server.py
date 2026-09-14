"""
ClaimPilot ML Inference Server (FastAPI)
Exposes the trained risk classification model over a secure internal REST endpoint.
"""

import os
import time
import json
import joblib
import pandas as pd
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Security, status, Header
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
import uvicorn
import warnings
warnings.filterwarnings('ignore')

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", r"D:\sih\ml\models\risk_model.pkl")
FEATURES_PATH = os.getenv("FEATURES_PATH", r"D:\sih\ml\models\feature_columns.json")
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
    version="2.0.0"
)

# Global state
model = None
feature_columns = None

@app.on_event("startup")
def load_resources():
    global model, feature_columns
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at {MODEL_PATH}.")
    if not os.path.exists(FEATURES_PATH):
        raise RuntimeError(f"Features file not found at {FEATURES_PATH}.")
        
    model = joblib.load(MODEL_PATH)
    with open(FEATURES_PATH, 'r') as f:
        feature_columns = json.load(f)
    print(f"Loaded Risk Model and {len(feature_columns)} features successfully.")

class ClaimFeatures(BaseModel):
    claim_type: str = Field(..., json_schema_extra={"example": "Multi-vehicle Collision"})
    amount_requested: float = Field(..., ge=0.0, json_schema_extra={"example": 24500.0})
    doc_confidence_score: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.92})
    consistency_score: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.88})
    days_since_incident: int = Field(..., ge=0, json_schema_extra={"example": 5})
    has_police_report: int = Field(..., ge=0, le=1, json_schema_extra={"example": 1})
    has_medical_certificate: int = Field(0, ge=0, le=1) # Renamed from has_medical_cert to match new schema
    has_death_certificate: int = Field(0, ge=0, le=1)
    has_repair_estimate: int = Field(1, ge=0, le=1)
    document_count: int = Field(2, ge=0)
    policy_number_extracted: int = Field(1, ge=0, le=1)
    amount_vs_policy_limit_ratio: float = Field(0.5, ge=0.0)
    incident_on_weekend: int = Field(0, ge=0, le=1)
    submission_within_7_days: int = Field(1, ge=0, le=1)
    name_mismatch: int = Field(0, ge=0, le=1)
    date_mismatch: int = Field(0, ge=0, le=1)
    prior_claims_count: int = Field(..., ge=0, json_schema_extra={"example": 1})

class PredictionResponse(BaseModel):
    decision: str
    confidence: float
    risk_score: float
    probabilities: Dict[str, float]
    latency_ms: float

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "features_loaded": feature_columns is not None,
        "timestamp": time.time()
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_claim_risk(
    features: ClaimFeatures,
    key: str = Security(verify_api_key)
):
    if model is None or feature_columns is None:
        raise HTTPException(status_code=503, detail="Model/Features not loaded")
    
    start_time = time.perf_counter()

    # Build input features dynamically
    input_dict = features.dict()
    df_features = {}
    
    for col in feature_columns:
        if col.startswith('claim_type_'):
            ctype = col.replace('claim_type_', '')
            df_features[col] = 1 if input_dict.get('claim_type') == ctype else 0
        else:
            df_features[col] = input_dict.get(col, 0)
            
    input_df = pd.DataFrame([df_features], columns=feature_columns)

    # Predict
    classes = model.classes_
    probabilities = model.predict_proba(input_df)[0]
    prob_dict = {str(cls): round(float(prob), 4) for cls, prob in zip(classes, probabilities)}

    decision = str(model.predict(input_df)[0])
    confidence = round(float(prob_dict[decision]), 4)

    # Risk score: 0 (safe) to 100 (high risk)
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
    uvicorn.run(app, host="127.0.0.1", port=8001)
