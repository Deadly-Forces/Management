"""
ClaimPilot — Data Preprocessing Pipeline
==========================================
Loads insurance_claims.csv (primary) and fraud_oracle.csv (secondary),
maps columns to the required 17-feature schema, derives missing features,
maps labels to 3-class (APPROVE/REJECT/ESCALATE), one-hot encodes claim_type,
and saves the result to ml/training/processed_claims.csv.
"""

import os
import numpy as np
import pandas as pd

np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Dataset")
OUTPUT_DIR = os.path.join(BASE_DIR, "training")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. LOAD PRIMARY DATASET — insurance_claims.csv
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("=" * 70)
print("STEP 1: Loading primary dataset — insurance_claims.csv")
print("=" * 70)

primary_path = os.path.join(DATASET_DIR, "insurance_claims.csv")
df_primary = pd.read_csv(primary_path, low_memory=False)
print(f"  Loaded: {df_primary.shape[0]} rows × {df_primary.shape[1]} columns")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. PROCESS PRIMARY DATASET
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("\nSTEP 2: Processing primary dataset features")

p = pd.DataFrame()

# Direct mappings
p['claim_type'] = df_primary['incident_type']
p['amount_requested'] = df_primary['total_claim_amount'].astype(float)

# Derived: days_since_incident
incident_dates = pd.to_datetime(df_primary['incident_date'])
p['days_since_incident'] = (incident_dates.max() - incident_dates).dt.days

# Derived: prior_claims_count (not available — default 0)
p['prior_claims_count'] = 0

# Derived: doc_confidence_score (simulated OCR confidence)
p['doc_confidence_score'] = np.random.uniform(0.70, 0.99, len(df_primary))

# Derived: consistency_score (simulated cross-doc consistency)
p['consistency_score'] = np.random.uniform(0.60, 1.00, len(df_primary))

# Derived: has_police_report
p['has_police_report'] = df_primary['police_report_available'].map(
    {'YES': 1, 'NO': 0, '?': 0}
).fillna(0).astype(int)

# Derived: has_medical_certificate
p['has_medical_certificate'] = (df_primary['bodily_injuries'] > 0).astype(int)

# Derived: has_death_certificate
p['has_death_certificate'] = (
    (df_primary['incident_severity'] == 'Total Loss') &
    (df_primary['bodily_injuries'] >= 2)
).astype(int)

# Derived: has_repair_estimate
p['has_repair_estimate'] = df_primary['property_damage'].map(
    {'YES': 1, 'NO': 0, '?': 0}
).fillna(0).astype(int)

# Derived: document_count
p['document_count'] = (
    p['has_police_report'] + p['has_medical_certificate'] +
    p['has_death_certificate'] + p['has_repair_estimate']
)

# Derived: policy_number_extracted (1 = policy number present)
p['policy_number_extracted'] = 1

# Derived: amount_vs_policy_limit_ratio
p['amount_vs_policy_limit_ratio'] = (
    df_primary['total_claim_amount'] /
    (df_primary['policy_annual_premium'] * 12)
).round(4)

# Derived: incident_on_weekend
p['incident_on_weekend'] = (
    pd.to_datetime(df_primary['incident_date']).dt.dayofweek >= 5
).astype(int)

# Derived: submission_within_7_days
p['submission_within_7_days'] = (p['days_since_incident'] <= 7).astype(int)

# Derived: name_mismatch (simulated 5% rate)
p['name_mismatch'] = np.random.binomial(1, 0.05, len(df_primary))

# Derived: date_mismatch (simulated 8% rate)
p['date_mismatch'] = np.random.binomial(1, 0.08, len(df_primary))

# Label mapping
def map_decision_primary(row_idx):
    fraud = df_primary.iloc[row_idx]['fraud_reported']
    severity = df_primary.iloc[row_idx]['incident_severity']
    if fraud == 'Y':
        return 'REJECT'
    elif severity in ['Trivial Damage', 'Minor Damage']:
        return 'APPROVE'
    else:
        return 'ESCALATE'

p['decision'] = [map_decision_primary(i) for i in range(len(df_primary))]

print(f"  Primary processed: {p.shape[0]} rows")
print(f"  Primary class distribution:")
for cls, cnt in p['decision'].value_counts().items():
    print(f"    {cls:12s} {cnt:5d} ({cnt/len(p)*100:.1f}%)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. LOAD & PROCESS SECONDARY DATASET — fraud_oracle.csv
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("\n" + "=" * 70)
print("STEP 3: Loading secondary dataset — fraud_oracle.csv")
print("=" * 70)

oracle_path = os.path.join(DATASET_DIR, "fraud_oracle.csv", "fraud_oracle.csv")
df_oracle = pd.read_csv(oracle_path, low_memory=False)
print(f"  Loaded: {df_oracle.shape[0]} rows × {df_oracle.shape[1]} columns")

s = pd.DataFrame()

# Mapped: claim_type from VehicleCategory
vehicle_map = {
    'Sedan': 'Multi-vehicle Collision',
    'Sport': 'Single Vehicle Collision',
    'Utility': 'Vehicle Theft'
}
s['claim_type'] = df_oracle['VehicleCategory'].map(vehicle_map).fillna('Parked Car')

# Mapped: amount_requested from Deductible (scale 100x to match primary range)
s['amount_requested'] = df_oracle['Deductible'].astype(float) * 100.0

# Mapped: days_since_incident from Days_Policy_Accident
days_map = {
    '1 to 7': 4,
    '8 to 15': 12,
    '15 to 30': 22,
    'more than 30': 45,
    'none': 0
}
s['days_since_incident'] = df_oracle['Days_Policy_Accident'].map(days_map).fillna(45).astype(int)

# Mapped: prior_claims_count from PastNumberOfClaims
claims_map = {'none': 0, '1': 1, '2 to 4': 3, 'more than 4': 5}
s['prior_claims_count'] = df_oracle['PastNumberOfClaims'].map(claims_map).fillna(0).astype(int)

# Simulated features
s['doc_confidence_score'] = np.random.uniform(0.70, 0.99, len(df_oracle))
s['consistency_score'] = np.random.uniform(0.60, 1.00, len(df_oracle))

# Mapped: has_police_report from PoliceReportFiled
s['has_police_report'] = df_oracle['PoliceReportFiled'].map({'Yes': 1, 'No': 0}).fillna(0).astype(int)

# Derived: has_medical_certificate from WitnessPresent as proxy
s['has_medical_certificate'] = df_oracle['WitnessPresent'].map({'Yes': 1, 'No': 0}).fillna(0).astype(int)

# Derived: has_death_certificate (rare event — 2% simulation)
s['has_death_certificate'] = np.random.binomial(1, 0.02, len(df_oracle))

# Derived: has_repair_estimate (vehicle claims → most have repair estimates)
s['has_repair_estimate'] = np.random.binomial(1, 0.70, len(df_oracle))

# document_count
s['document_count'] = (
    s['has_police_report'] + s['has_medical_certificate'] +
    s['has_death_certificate'] + s['has_repair_estimate']
)

# policy_number_extracted (all oracle records have policy numbers)
s['policy_number_extracted'] = 1

# amount_vs_policy_limit_ratio (simulated — no premium data)
s['amount_vs_policy_limit_ratio'] = np.random.uniform(0.5, 8.0, len(df_oracle)).round(4)

# incident_on_weekend from DayOfWeek
s['incident_on_weekend'] = df_oracle['DayOfWeek'].isin(['Saturday', 'Sunday']).astype(int)

# submission_within_7_days
s['submission_within_7_days'] = (s['days_since_incident'] <= 7).astype(int)

# name_mismatch and date_mismatch (simulated)
s['name_mismatch'] = np.random.binomial(1, 0.05, len(df_oracle))
s['date_mismatch'] = np.random.binomial(1, 0.08, len(df_oracle))

# Label mapping for oracle
# Map fraud_reported first
df_oracle['_fraud_flag'] = df_oracle['FraudFound_P'].map({1: 'Y', 0: 'N'})

def map_decision_oracle(idx):
    fraud = df_oracle.iloc[idx]['_fraud_flag']
    fault = df_oracle.iloc[idx]['Fault']
    if fraud == 'Y':
        return 'REJECT'
    elif fault == 'Third Party':
        return 'ESCALATE'
    else:
        return 'APPROVE'

s['decision'] = [map_decision_oracle(i) for i in range(len(df_oracle))]

print(f"  Oracle processed: {s.shape[0]} rows")
print(f"  Oracle class distribution:")
for cls, cnt in s['decision'].value_counts().items():
    print(f"    {cls:12s} {cnt:5d} ({cnt/len(s)*100:.1f}%)")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. CONCATENATE & ONE-HOT ENCODE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("\n" + "=" * 70)
print("STEP 4: Concatenating datasets and one-hot encoding claim_type")
print("=" * 70)

combined = pd.concat([p, s], ignore_index=True)
print(f"  Combined shape: {combined.shape[0]} rows × {combined.shape[1]} columns")

# One-hot encode claim_type
claim_type_dummies = pd.get_dummies(combined['claim_type'], prefix='claim_type').astype(int)
combined = pd.concat([combined.drop('claim_type', axis=1), claim_type_dummies], axis=1)

# Drop any NaN rows
before = len(combined)
combined = combined.dropna()
after = len(combined)
if before != after:
    print(f"  ⚠ Dropped {before - after} rows with NaN values")

print(f"  Final shape: {combined.shape[0]} rows × {combined.shape[1]} columns")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. FINAL REPORT & SAVE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("\n" + "=" * 70)
print("STEP 5: Final report and save")
print("=" * 70)

print(f"\n  Final class distribution:")
for cls, cnt in combined['decision'].value_counts().items():
    pct = cnt / len(combined) * 100
    bar = '█' * int(pct / 2)
    print(f"    {cls:12s} {cnt:6d} ({pct:5.1f}%) {bar}")

# Check for class imbalance
min_class_pct = combined['decision'].value_counts(normalize=True).min() * 100
if min_class_pct < 15:
    print(f"\n  ⚠ CLASS IMBALANCE WARNING: minority class = {min_class_pct:.1f}%")
    print(f"    → Use class_weight='balanced' during training")

print(f"\n  Feature columns ({combined.shape[1] - 1}):")
for col in combined.columns:
    if col != 'decision':
        print(f"    {col}")

print(f"\n  First 5 rows:")
print(combined.head().to_string(index=False))

# Save
output_path = os.path.join(OUTPUT_DIR, "processed_claims.csv")
combined.to_csv(output_path, index=False)
print(f"\n  ✅ Saved to: {output_path}")
print(f"     {combined.shape[0]} rows × {combined.shape[1]} columns")
print(f"\nDONE — Preprocessing complete.")
