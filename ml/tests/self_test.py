import pandas as pd
import joblib
import json
import warnings
warnings.filterwarnings('ignore')

def main():
    model = joblib.load(r'D:\sih\ml\models\risk_model.pkl')
    with open(r'D:\sih\ml\models\feature_columns.json', 'r') as f:
        feature_columns = json.load(f)

    test_cases = [
        # Test Case 1: Low-risk auto claim -> APPROVE
        {
            "expected": "APPROVE",
            "features": {
                "amount_requested": 5000, "days_since_incident": 2, "prior_claims_count": 0,
                "doc_confidence_score": 0.95, "consistency_score": 0.92,
                "has_police_report": 1, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 1, "document_count": 2, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 0.5, "incident_on_weekend": 0,
                "submission_within_7_days": 1, "name_mismatch": 0, "date_mismatch": 0,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 0
            }
        },
        # Test Case 2: Suspicious high-amount + name mismatch -> REJECT
        {
            "expected": "REJECT",
            "features": {
                "amount_requested": 95000, "days_since_incident": 45, "prior_claims_count": 5,
                "doc_confidence_score": 0.72, "consistency_score": 0.61,
                "has_police_report": 0, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 0, "document_count": 0, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 7.5, "incident_on_weekend": 1,
                "submission_within_7_days": 0, "name_mismatch": 1, "date_mismatch": 1,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 1, "claim_type_Vehicle Theft": 0
            }
        },
        # Test Case 3: Medium complexity -> ESCALATE
        {
            "expected": "ESCALATE",
            "features": {
                "amount_requested": 45000, "days_since_incident": 20, "prior_claims_count": 2,
                "doc_confidence_score": 0.85, "consistency_score": 0.78,
                "has_police_report": 1, "has_medical_certificate": 1, "has_death_certificate": 0,
                "has_repair_estimate": 1, "document_count": 3, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 3.5, "incident_on_weekend": 0,
                "submission_within_7_days": 0, "name_mismatch": 0, "date_mismatch": 0,
                "claim_type_Multi-vehicle Collision": 1, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 0
            }
        },
        # Test 4: Vehicle theft -> REJECT (often high risk if docs missing)
        {
            "expected": "REJECT",
            "features": {
                "amount_requested": 30000, "days_since_incident": 30, "prior_claims_count": 3,
                "doc_confidence_score": 0.60, "consistency_score": 0.55,
                "has_police_report": 0, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 0, "document_count": 0, "policy_number_extracted": 0,
                "amount_vs_policy_limit_ratio": 2.0, "incident_on_weekend": 1,
                "submission_within_7_days": 0, "name_mismatch": 1, "date_mismatch": 1,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 1
            }
        },
        # Test 5: Parked car minor damage -> APPROVE
        {
            "expected": "APPROVE",
            "features": {
                "amount_requested": 1500, "days_since_incident": 1, "prior_claims_count": 0,
                "doc_confidence_score": 0.98, "consistency_score": 0.99,
                "has_police_report": 0, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 1, "document_count": 1, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 0.1, "incident_on_weekend": 0,
                "submission_within_7_days": 1, "name_mismatch": 0, "date_mismatch": 0,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 1,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 0
            }
        },
        # Test 6: All documents present, low amount -> APPROVE
        {
            "expected": "APPROVE",
            "features": {
                "amount_requested": 12000, "days_since_incident": 3, "prior_claims_count": 1,
                "doc_confidence_score": 0.96, "consistency_score": 0.95,
                "has_police_report": 1, "has_medical_certificate": 1, "has_death_certificate": 0,
                "has_repair_estimate": 1, "document_count": 3, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 0.8, "incident_on_weekend": 0,
                "submission_within_7_days": 1, "name_mismatch": 0, "date_mismatch": 0,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 1, "claim_type_Vehicle Theft": 0
            }
        },
        # Test 7: High amount, no documents -> REJECT
        {
            "expected": "REJECT",
            "features": {
                "amount_requested": 110000, "days_since_incident": 60, "prior_claims_count": 4,
                "doc_confidence_score": 0.65, "consistency_score": 0.60,
                "has_police_report": 0, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 0, "document_count": 0, "policy_number_extracted": 0,
                "amount_vs_policy_limit_ratio": 5.0, "incident_on_weekend": 1,
                "submission_within_7_days": 0, "name_mismatch": 1, "date_mismatch": 1,
                "claim_type_Multi-vehicle Collision": 1, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 0
            }
        },
        # Test 8: Third-party fault, medium -> ESCALATE
        {
            "expected": "ESCALATE",
            "features": {
                "amount_requested": 25000, "days_since_incident": 14, "prior_claims_count": 2,
                "doc_confidence_score": 0.82, "consistency_score": 0.85,
                "has_police_report": 1, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 1, "document_count": 2, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 2.5, "incident_on_weekend": 1,
                "submission_within_7_days": 0, "name_mismatch": 0, "date_mismatch": 0,
                "claim_type_Multi-vehicle Collision": 1, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 0
            }
        },
        # Test 9: Weekend incident, delayed submission -> ESCALATE
        {
            "expected": "ESCALATE",
            "features": {
                "amount_requested": 35000, "days_since_incident": 25, "prior_claims_count": 1,
                "doc_confidence_score": 0.75, "consistency_score": 0.80,
                "has_police_report": 1, "has_medical_certificate": 1, "has_death_certificate": 0,
                "has_repair_estimate": 0, "document_count": 2, "policy_number_extracted": 1,
                "amount_vs_policy_limit_ratio": 3.0, "incident_on_weekend": 1,
                "submission_within_7_days": 0, "name_mismatch": 0, "date_mismatch": 1,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 1, "claim_type_Vehicle Theft": 0
            }
        },
        # Test 10: All zeros (adversarial) -> any (just verify no crash)
        {
            "expected": "ANY",
            "features": {
                "amount_requested": 0, "days_since_incident": 0, "prior_claims_count": 0,
                "doc_confidence_score": 0, "consistency_score": 0,
                "has_police_report": 0, "has_medical_certificate": 0, "has_death_certificate": 0,
                "has_repair_estimate": 0, "document_count": 0, "policy_number_extracted": 0,
                "amount_vs_policy_limit_ratio": 0, "incident_on_weekend": 0,
                "submission_within_7_days": 0, "name_mismatch": 0, "date_mismatch": 0,
                "claim_type_Multi-vehicle Collision": 0, "claim_type_Parked Car": 0,
                "claim_type_Single Vehicle Collision": 0, "claim_type_Vehicle Theft": 0
            }
        }
    ]

    passed = 0
    for i, test in enumerate(test_cases, 1):
        df = pd.DataFrame([test["features"]], columns=feature_columns)
        
        # Predict
        pred = model.predict(df)[0]
        
        if test["expected"] == "ANY":
            print(f"Test Case {i}: Prediction={pred} | Expected={test['expected']} -> PASS (No Crash)")
            passed += 1
        elif pred == test["expected"]:
            print(f"Test Case {i}: Prediction={pred} | Expected={test['expected']} -> PASS")
            passed += 1
        else:
            print(f"Test Case {i}: Prediction={pred} | Expected={test['expected']} -> FAIL")
            
    print(f"\nSummary: {passed}/10 PASSED")

if __name__ == "__main__":
    main()
