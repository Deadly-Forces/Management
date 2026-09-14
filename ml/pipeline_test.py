import pandas as pd
import joblib
import json
import warnings
warnings.filterwarnings('ignore')

def main():
    model = joblib.load(r'D:\sih\ml\models\risk_model.pkl')
    with open(r'D:\sih\ml\models\feature_columns.json', 'r') as f:
        feature_columns = json.load(f)

    # Simulate backend pipeline sending data
    mock_claims = [
        {
            "claim_type": "Multi-vehicle Collision",
            "amount_requested": 25000.0,
            "doc_confidence_score": 0.95,
            "consistency_score": 0.90,
            "days_since_incident": 3,
            "has_police_report": 1,
            "has_medical_certificate": 1,
            "has_death_certificate": 0,
            "has_repair_estimate": 1,
            "document_count": 3,
            "policy_number_extracted": 1,
            "amount_vs_policy_limit_ratio": 1.2,
            "incident_on_weekend": 0,
            "submission_within_7_days": 1,
            "name_mismatch": 0,
            "date_mismatch": 0
        },
        {
            "claim_type": "Vehicle Theft",
            "amount_requested": 55000.0,
            "doc_confidence_score": 0.70,
            "consistency_score": 0.65,
            "days_since_incident": 15,
            "has_police_report": 0,
            "has_medical_certificate": 0,
            "has_death_certificate": 0,
            "has_repair_estimate": 0,
            "document_count": 0,
            "policy_number_extracted": 1,
            "amount_vs_policy_limit_ratio": 4.5,
            "incident_on_weekend": 1,
            "submission_within_7_days": 0,
            "name_mismatch": 1,
            "date_mismatch": 1
        },
        {
            "claim_type": "Parked Car",
            "amount_requested": 1200.0,
            "doc_confidence_score": 0.99,
            "consistency_score": 0.98,
            "days_since_incident": 1,
            "has_police_report": 0,
            "has_medical_certificate": 0,
            "has_death_certificate": 0,
            "has_repair_estimate": 1,
            "document_count": 1,
            "policy_number_extracted": 1,
            "amount_vs_policy_limit_ratio": 0.05,
            "incident_on_weekend": 0,
            "submission_within_7_days": 1,
            "name_mismatch": 0,
            "date_mismatch": 0
        }
    ]

    all_passed = True

    for i, claim in enumerate(mock_claims, 1):
        # b. Convert to feature DataFrame matching feature_columns
        # We need to construct the feature vector with one-hot encoding for claim_type
        # plus the prior_claims_count
        features = {}
        for col in feature_columns:
            if col.startswith('claim_type_'):
                ctype = col.replace('claim_type_', '')
                features[col] = 1 if claim.get('claim_type') == ctype else 0
            elif col == 'prior_claims_count':
                features[col] = claim.get('prior_claims_count', 0)
            else:
                features[col] = claim.get(col, 0)
                
        df = pd.DataFrame([features], columns=feature_columns)
        
        # c. Assert feature shape matches (1, len(feature_columns))
        assert df.shape == (1, len(feature_columns)), f"Shape mismatch: {df.shape}"
        
        # d. Run model.predict() and model.predict_proba()
        decision = model.predict(df)[0]
        probas = model.predict_proba(df)[0]
        classes = model.classes_
        
        prob_dict = {str(c): float(p) for c, p in zip(classes, probas)}
        confidence = prob_dict.get(decision, 0.0)
        risk_score = prob_dict.get("REJECT", 0.0) * 100 + prob_dict.get("ESCALATE", 0.0) * 50
        
        # e. Format JSON output
        result = {
            "decision": decision,
            "confidence": round(confidence, 4),
            "risk_score": round(risk_score, 2),
            "probabilities": {k: round(v, 4) for k, v in prob_dict.items()}
        }
        
        print(f"\nPipeline Test {i}:")
        print(json.dumps(result, indent=2))
        
        # f. Assert decision is in ['APPROVE', 'REJECT', 'ESCALATE']
        if decision not in ['APPROVE', 'REJECT', 'ESCALATE']:
            print(f"FAIL: Invalid decision {decision}")
            all_passed = False
            
        # g. Assert all probability values sum to ~1.0
        if not (0.99 <= sum(probas) <= 1.01):
            print(f"FAIL: Probabilities do not sum to 1.0 (Sum: {sum(probas)})")
            all_passed = False
            
        # h. Assert confidence is between 0 and 1
        if not (0 <= confidence <= 1):
            print(f"FAIL: Confidence out of bounds ({confidence})")
            all_passed = False

    if all_passed:
        print("\nALL PIPELINE TESTS PASSED")

if __name__ == "__main__":
    main()
