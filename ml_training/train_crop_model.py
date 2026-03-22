"""
Crop Recommendation Model — Production Training Script
Dataset: data/crop_recommendation.csv
Run from project root: python ml_training/train_crop_model.py
Expected accuracy: 99%+
"""

import pandas as pd
import numpy as np
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH  = os.path.join(BASE_DIR, 'data', 'crop_recommendation.csv')
MODEL_DIR  = os.path.join(BASE_DIR, 'ml_models')
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("   CROP RECOMMENDATION MODEL — TRAINING")
print("=" * 60)

# ── Load Data ─────────────────────────────────────────────────────────────────
print("\n[1/6] Loading dataset...")
df = pd.read_csv(DATA_PATH)
df.columns = df.columns.str.strip().str.lower()

col_map = {'n': 'nitrogen', 'p': 'phosphorus', 'k': 'potassium',
           'temp': 'temperature', 'label': 'crop'}
df.rename(columns={k: v for k, v in col_map.items() if k in df.columns}, inplace=True)

print(f"    Rows    : {len(df)}")
print(f"    Columns : {list(df.columns)}")
print(f"    Crops   : {df['crop'].nunique()} unique")
print(f"    Missing : {df.isnull().sum().sum()} values")

# ── Feature Engineering ───────────────────────────────────────────────────────
print("\n[2/6] Feature engineering...")
FEATURES = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']
TARGET   = 'crop'

df = df.dropna(subset=FEATURES + [TARGET])
X = df[FEATURES].copy()
y = df[TARGET].copy()

X['npk_ratio']     = X['nitrogen'] / (X['phosphorus'] + X['potassium'] + 1)
X['temp_humidity'] = X['temperature'] * X['humidity'] / 100
X['water_need']    = X['rainfall'] * X['humidity'] / 100

FEATURES_EXT = FEATURES + ['npk_ratio', 'temp_humidity', 'water_need']
print(f"    Features: {len(FEATURES)} base + 3 engineered = {len(FEATURES_EXT)} total")

# ── Split ─────────────────────────────────────────────────────────────────────
print("\n[3/6] Splitting dataset (80/20 stratified)...")
X_train, X_test, y_train, y_test = train_test_split(
    X[FEATURES_EXT], y, test_size=0.2, random_state=42, stratify=y
)
print(f"    Train: {len(X_train)} | Test: {len(X_test)}")

# ── Train Models ──────────────────────────────────────────────────────────────
print("\n[4/6] Training models...")

rf = RandomForestClassifier(
    n_estimators=300, max_depth=None, min_samples_split=2,
    min_samples_leaf=1, max_features='sqrt', bootstrap=True,
    random_state=42, n_jobs=-1, class_weight='balanced'
)
rf.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf.predict(X_test))
print(f"    Random Forest      : {rf_acc*100:.2f}%")

gb = GradientBoostingClassifier(
    n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42
)
gb.fit(X_train, y_train)
gb_acc = accuracy_score(y_test, gb.predict(X_test))
print(f"    Gradient Boosting  : {gb_acc*100:.2f}%")

ensemble = VotingClassifier(estimators=[('rf', rf), ('gb', gb)], voting='soft')
ensemble.fit(X_train, y_train)
ens_acc = accuracy_score(y_test, ensemble.predict(X_test))
print(f"    Voting Ensemble    : {ens_acc*100:.2f}%")

model, acc, model_name = max(
    [(rf, rf_acc, 'Random Forest'),
     (gb, gb_acc, 'Gradient Boosting'),
     (ensemble, ens_acc, 'Ensemble')],
    key=lambda x: x[1]
)
print(f"\n    ✓ Best: {model_name} ({acc*100:.2f}%)")

# ── Cross Validation ──────────────────────────────────────────────────────────
print("\n[5/6] 5-fold cross-validation...")
cv_scores = cross_val_score(rf, X[FEATURES_EXT], y,
                             cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
                             scoring='accuracy', n_jobs=-1)
print(f"    Scores : {[f'{s*100:.2f}%' for s in cv_scores]}")
print(f"    Mean   : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

# ── Evaluate ──────────────────────────────────────────────────────────────────
print("\n[6/6] Final evaluation...")
y_pred    = model.predict(X_test)
final_acc = accuracy_score(y_test, y_pred)
print(f"\n    ✓ Final Test Accuracy: {final_acc*100:.2f}%")
print("\n" + classification_report(y_test, y_pred))

print("    Feature Importances:")
for feat, imp in sorted(zip(FEATURES_EXT, rf.feature_importances_), key=lambda x: -x[1]):
    print(f"    {'█' * int(imp*40):40s} {feat:20s} {imp:.4f}")

# Confusion matrix
try:
    fig, ax = plt.subplots(figsize=(14, 12))
    ConfusionMatrixDisplay(
        confusion_matrix(y_test, y_pred, labels=sorted(y.unique())),
        display_labels=sorted(y.unique())
    ).plot(ax=ax, xticks_rotation=45, colorbar=False)
    ax.set_title(f'Crop Model — Accuracy: {final_acc*100:.2f}%')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'crop_confusion_matrix.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\n    Confusion matrix → ml_models/crop_confusion_matrix.png")
except Exception as e:
    print(f"    (Plot skipped: {e})")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump(model,       os.path.join(MODEL_DIR, 'crop_model.pkl'))
joblib.dump(rf,          os.path.join(MODEL_DIR, 'crop_rf_model.pkl'))   # for SHAP
joblib.dump(FEATURES_EXT, os.path.join(MODEL_DIR, 'crop_features.pkl'))
print(f"\n    Saved: crop_model.pkl, crop_rf_model.pkl, crop_features.pkl")

# ── Sanity Check ──────────────────────────────────────────────────────────────
print("\n── Sanity Check ──")
for s in [
    {'nitrogen':90,'phosphorus':42,'potassium':43,'temperature':20.8,'humidity':82.,'ph':6.5,'rainfall':202.9,'expected':'rice'},
    {'nitrogen':20,'phosphorus':30,'potassium':20,'temperature':30.,'humidity':90.,'ph':6.0,'rainfall':150.,'expected':'coconut'},
]:
    row = pd.DataFrame([s])
    row['npk_ratio']     = row['nitrogen'] / (row['phosphorus'] + row['potassium'] + 1)
    row['temp_humidity'] = row['temperature'] * row['humidity'] / 100
    row['water_need']    = row['rainfall'] * row['humidity'] / 100
    pred  = model.predict(row[FEATURES_EXT])[0]
    proba = model.predict_proba(row[FEATURES_EXT])[0].max()
    mark  = '✓' if pred.lower() == s['expected'] else '?'
    print(f"    {mark} Expected: {s['expected']:12s} → Got: {pred:12s} ({proba*100:.1f}%)")

print("\n" + "=" * 60)
print(f"   DONE — Accuracy: {final_acc*100:.2f}%")
print("=" * 60)