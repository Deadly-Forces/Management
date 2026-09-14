"""
ClaimPilot Risk Model Training Pipeline
Trains a calibrated Random Forest Classifier to triage claims into
APPROVE, REJECT, or ESCALATE.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score

def train_risk_model(data_path: str = "ml/training/synthetic_claims.csv", model_output_path: str = "ml/models/risk_model.pkl"):
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    
    if not os.path.exists(data_path):
        if os.path.exists("ml/synthetic_claims.csv"):
            data_path = "ml/synthetic_claims.csv"
        else:
            raise FileNotFoundError(f"Training dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    print(f"Loaded dataset from {data_path} with {len(df)} samples.")
    
    # Verify class balance
    class_proportions = df['label'].value_counts(normalize=True)
    escalate_pct = class_proportions.get('ESCALATE', 0.0)
    print(f"Class proportions:\n{class_proportions}")
    
    use_balanced_weights = 'balanced' if escalate_pct <= 0.15 else None
    print(f"Using class_weight='{use_balanced_weights}' based on imbalance audit.")

    categorical_features = ['claim_type']
    numeric_features = [
        'amount_requested',
        'doc_confidence_score',
        'consistency_score',
        'days_since_incident',
        'has_police_report',
        'has_medical_cert',
        'prior_claims_count'
    ]

    X = df[categorical_features + numeric_features]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ]
    )

    rf_clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight=use_balanced_weights,
        random_state=42
    )

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', rf_clf)
    ])

    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    y_pred_proba = model_pipeline.predict_proba(X_test)

    weighted_f1 = f1_score(y_test, y_pred, average='weighted')
    acc = accuracy_score(y_test, y_pred)
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    full_report = classification_report(y_test, y_pred, digits=4)

    print("\n" + "="*50)
    print("      CLAIM RISK MODEL CLASSIFICATION REPORT")
    print("="*50)
    print(full_report)
    print(f"Overall Accuracy: {acc:.4f}")
    print(f"Weighted F1 Score: {weighted_f1:.4f} (Target: > 0.80)")

    # Audit individual class F1 scores
    for label in ['APPROVE', 'REJECT', 'ESCALATE']:
        label_f1 = report_dict[label]['f1-score']
        print(f"Class '{label}' F1: {label_f1:.4f}")
        if label_f1 < 0.70:
            print(f"⚠️ WARNING: Class '{label}' F1 is below 0.70 threshold!")

    assert weighted_f1 >= 0.80, f"Model failed weighted F1 target (achieved {weighted_f1:.4f})"

    # Save trained pipeline
    joblib.dump(model_pipeline, model_output_path)
    print(f"\nTrained risk model successfully saved to {model_output_path}")
    return model_pipeline

if __name__ == "__main__":
    train_risk_model()
