"""
ClaimPilot Synthetic Claims Data Generator
Generates realistic insurance claim records with calibrated distributions
matching targets: APPROVE ~60%, REJECT ~25%, ESCALATE ~15%.
"""

import os
import random
import numpy as np
import pandas as pd
from faker import Faker

fake = Faker()
np.random.seed(42)
random.seed(42)

CLAIM_TYPES = ['AUTO', 'PROPERTY', 'LIFE_DEATH']

def generate_synthetic_dataset(num_samples: int = 2500, output_path: str = "ml/training/synthetic_claims.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    records = []
    
    # Target allocations
    # ~60% APPROVE (1500), ~25% REJECT (625), ~15% ESCALATE (375)
    n_approve = int(num_samples * 0.60)
    n_reject = int(num_samples * 0.25)
    n_escalate = num_samples - n_approve - n_reject

    # 1. APPROVE samples: High consistency, high OCR doc confidence, reasonable amount, valid docs
    for _ in range(n_approve):
        claim_type = random.choices(CLAIM_TYPES, weights=[0.5, 0.3, 0.2])[0]
        if claim_type == 'AUTO':
            amount = round(np.random.gamma(shape=3.0, scale=8000.0) + 1500, 2)
            has_police = 1 if amount > 30000 else random.choice([0, 1])
            has_med = 0
        elif claim_type == 'PROPERTY':
            amount = round(np.random.gamma(shape=3.5, scale=15000.0) + 5000, 2)
            has_police = 1 if amount > 50000 else random.choice([0, 1])
            has_med = 0
        else: # LIFE_DEATH
            amount = round(np.random.uniform(50000, 300000), 2)
            has_police = random.choice([0, 1])
            has_med = 1

        doc_conf = round(float(np.clip(np.random.beta(a=8, b=1.5), 0.75, 0.99)), 3)
        consistency = round(float(np.clip(np.random.beta(a=9, b=1.2), 0.80, 1.0)), 3)
        days_since = int(np.clip(np.random.exponential(scale=10), 1, 60))
        prior_claims = int(np.random.choice([0, 1, 2], p=[0.70, 0.22, 0.08]))
        
        records.append({
            'claim_type': claim_type,
            'amount_requested': amount,
            'doc_confidence_score': doc_conf,
            'consistency_score': consistency,
            'days_since_incident': days_since,
            'has_police_report': has_police,
            'has_medical_cert': has_med,
            'prior_claims_count': prior_claims,
            'label': 'APPROVE'
        })

    # 2. REJECT samples: Poor doc quality, low consistency, high prior claims, missing mandatory certs, inflated amounts
    for _ in range(n_reject):
        claim_type = random.choices(CLAIM_TYPES, weights=[0.45, 0.35, 0.2])[0]
        if claim_type == 'AUTO':
            amount = round(np.random.uniform(70000, 450000), 2)
            has_police = 0
            has_med = 0
        elif claim_type == 'PROPERTY':
            amount = round(np.random.uniform(150000, 1200000), 2)
            has_police = 0
            has_med = 0
        else: # LIFE_DEATH
            amount = round(np.random.uniform(400000, 1500000), 2)
            has_police = 0
            has_med = random.choice([0, 0, 1]) # frequently missing medical/death cert

        doc_conf = round(float(np.clip(np.random.beta(a=2, b=4), 0.20, 0.68)), 3)
        consistency = round(float(np.clip(np.random.beta(a=2, b=5), 0.15, 0.65)), 3)
        days_since = int(np.clip(np.random.exponential(scale=60) + 30, 20, 365))
        prior_claims = int(np.random.choice([2, 3, 4, 5, 6], p=[0.2, 0.3, 0.25, 0.15, 0.1]))

        records.append({
            'claim_type': claim_type,
            'amount_requested': amount,
            'doc_confidence_score': doc_conf,
            'consistency_score': consistency,
            'days_since_incident': days_since,
            'has_police_report': has_police,
            'has_medical_cert': has_med,
            'prior_claims_count': prior_claims,
            'label': 'REJECT'
        })

    # 3. ESCALATE samples: High value claims, boundary consistency, moderate confidence, ambiguous patterns
    for _ in range(n_escalate):
        claim_type = random.choices(CLAIM_TYPES, weights=[0.35, 0.40, 0.25])[0]
        if claim_type == 'AUTO':
            amount = round(np.random.uniform(40000, 150000), 2)
            has_police = random.choice([0, 1])
            has_med = 0
        elif claim_type == 'PROPERTY':
            amount = round(np.random.uniform(100000, 600000), 2)
            has_police = random.choice([0, 1])
            has_med = 0
        else: # LIFE_DEATH
            amount = round(np.random.uniform(250000, 800000), 2)
            has_police = random.choice([0, 1])
            has_med = 1

        doc_conf = round(float(np.clip(np.random.normal(loc=0.72, scale=0.06), 0.60, 0.85)), 3)
        consistency = round(float(np.clip(np.random.normal(loc=0.70, scale=0.07), 0.58, 0.82)), 3)
        days_since = int(np.clip(np.random.exponential(scale=25) + 10, 5, 120))
        prior_claims = int(np.random.choice([1, 2, 3], p=[0.45, 0.40, 0.15]))

        records.append({
            'claim_type': claim_type,
            'amount_requested': amount,
            'doc_confidence_score': doc_conf,
            'consistency_score': consistency,
            'days_since_incident': days_since,
            'has_police_report': has_police,
            'has_medical_cert': has_med,
            'prior_claims_count': prior_claims,
            'label': 'ESCALATE'
        })

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    
    df.to_csv(output_path, index=False)
    # Also write to root of ml/
    df.to_csv("ml/synthetic_claims.csv", index=False)

    print(f"Generated {len(df)} synthetic claim records.")
    print("Label breakdown:")
    print(df['label'].value_counts(normalize=True).apply(lambda x: f"{x*100:.1f}%"))
    return df

if __name__ == "__main__":
    generate_synthetic_dataset(num_samples=2500)
