import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.utils.class_weight import compute_sample_weight

def main():
    # 1. Load data
    df = pd.read_csv(r'D:\sih\ml\training\processed_claims.csv')
    
    # 2. Split X and y
    X = df.drop(columns=['decision'])
    y = df['decision']
    
    feature_columns = list(X.columns)
    
    # 3. Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # For XGBoost, encode labels
    label_map = {'APPROVE': 0, 'ESCALATE': 1, 'REJECT': 2}
    reverse_map = {0: 'APPROVE', 1: 'ESCALATE', 2: 'REJECT'}
    
    y_train_encoded = y_train.map(label_map)
    y_test_encoded = y_test.map(label_map)
    
    # 4. Train 3 models
    print("Training RandomForest...")
    rf = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    
    print("Training XGBoost...")
    sample_weights = compute_sample_weight('balanced', y_train_encoded)
    xgb = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42, n_estimators=200, n_jobs=-1)
    xgb.fit(X_train, y_train_encoded, sample_weight=sample_weights)
    
    print("Training LogisticRegression...")
    lr = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    
    # 5. Evaluate models
    models = {
        'RandomForest': rf,
        'XGBoost': xgb,
        'LogisticRegression': lr
    }
    
    best_model_name = None
    best_f1 = -1
    best_model = None
    results = {}
    
    for name, model in models.items():
        if name == 'XGBoost':
            preds_encoded = model.predict(X_test)
            preds = pd.Series(preds_encoded).map(reverse_map)
        else:
            preds = model.predict(X_test)
            
        print(f"\n--- {name} ---")
        print(classification_report(y_test, preds))
        w_f1 = f1_score(y_test, preds, average='weighted')
        print(f"Weighted F1: {w_f1:.4f}")
        
        per_class_f1 = f1_score(y_test, preds, average=None, labels=['APPROVE', 'ESCALATE', 'REJECT'])
        results[name] = {
            'w_f1': w_f1,
            'per_class': dict(zip(['APPROVE', 'ESCALATE', 'REJECT'], per_class_f1))
        }
        
        if w_f1 > best_f1:
            best_f1 = w_f1
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model: {best_model_name} with Weighted F1: {best_f1:.4f}")
    print(f"Per-class F1 for Best Model: {results[best_model_name]['per_class']}")
    
    os.makedirs(r'D:\sih\ml\models', exist_ok=True)
    
    if best_model_name == 'XGBoost':
        class XGBWrapper:
            def __init__(self, model):
                self.model = model
                self.classes_ = np.array(['APPROVE', 'ESCALATE', 'REJECT'])
            def predict(self, X):
                preds = self.model.predict(X)
                return np.array([self.classes_[p] for p in preds])
            def predict_proba(self, X):
                return self.model.predict_proba(X)
        best_model_to_save = XGBWrapper(best_model)
    else:
        best_model_to_save = best_model
        
    joblib.dump(best_model_to_save, r'D:\sih\ml\models\risk_model.pkl')
    
    with open(r'D:\sih\ml\models\feature_columns.json', 'w') as f:
        json.dump(feature_columns, f)

if __name__ == "__main__":
    main()
