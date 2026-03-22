"""
Yield Prediction Model — Production Training Script
Dataset: data/yield_df.csv
Run from project root: python ml_training/train_yield_model.py
Expected R²: 0.95+
"""

import pandas as pd
import numpy as np
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'ml_models')
os.makedirs(MODEL_DIR, exist_ok=True)

# Auto-detect yield CSV filename
DATA_DIR = os.path.join(BASE_DIR, 'data')
candidates = [f for f in os.listdir(DATA_DIR)
              if 'yield' in f.lower() and f.endswith('.csv')]
if not candidates:
    raise FileNotFoundError(
        "No yield CSV found in data/. "
        "Download from kaggle.com/datasets/patelris/crop-yield-prediction-dataset"
    )
DATA_PATH = os.path.join(DATA_DIR, candidates[0])

print("=" * 60)
print("   YIELD PREDICTION MODEL — TRAINING")
print("=" * 60)

# ── Load Data ─────────────────────────────────────────────────────────────────
print(f"\n[1/6] Loading dataset: {candidates[0]}")
df = pd.read_csv(DATA_PATH)
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
print(f"    Rows    : {len(df)}")
print(f"    Columns : {list(df.columns)}")

# ── Normalise Column Names ─────────────────────────────────────────────────────
print("\n[2/6] Normalising columns...")

# Map common Kaggle yield dataset column variations
rename_map = {
    'area'                         : 'country',
    'item'                         : 'crop',
    'year'                         : 'year',
    'average_rain_fall_mm_per_year': 'rainfall',
    'avg_temp'                     : 'temperature',
    'pesticides_tonnes'            : 'pesticide_use',
    'hg/ha_yield'                  : 'yield',
    'yield_(hg/ha)'                : 'yield',
    'value'                        : 'yield',
}
df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns}, inplace=True)
print(f"    Columns after rename: {list(df.columns)}")

# Verify required columns
required = ['crop', 'year', 'rainfall', 'pesticide_use', 'temperature', 'yield']
missing = [c for c in required if c not in df.columns]
if missing:
    print(f"\n    Available columns: {list(df.columns)}")
    raise ValueError(
        f"Missing columns: {missing}\n"
        "Please check your CSV column names and update rename_map above."
    )

df = df.dropna(subset=required)
print(f"    Clean rows: {len(df)}")
print(f"    Crops     : {df['crop'].nunique()} unique")
print(f"    Years     : {df['year'].min()} – {df['year'].max()}")

# ── Feature Engineering ───────────────────────────────────────────────────────
print("\n[3/6] Feature engineering...")

le = LabelEncoder()
df['crop_encoded'] = le.fit_transform(df['crop'])

# Derived features
df['rain_temp_ratio']    = df['rainfall'] / (df['temperature'] + 1)
df['pesticide_per_rain'] = df['pesticide_use'] / (df['rainfall'] + 1)
df['year_norm']          = (df['year'] - df['year'].min()) / (df['year'].max() - df['year'].min() + 1)

FEATURES = [
    'crop_encoded', 'year', 'rainfall', 'pesticide_use', 'temperature',
    'rain_temp_ratio', 'pesticide_per_rain', 'year_norm'
]
TARGET = 'yield'

X = df[FEATURES]
y = df[TARGET]
print(f"    Features: {len(FEATURES)} ({FEATURES})")
print(f"    Samples : {len(X)}")
print(f"    Yield range: {y.min():.0f} – {y.max():.0f} hg/ha")

# ── Split ─────────────────────────────────────────────────────────────────────
print("\n[4/6] Train/test split (80/20)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"    Train: {len(X_train)} | Test: {len(X_test)}")

# ── Train Models ──────────────────────────────────────────────────────────────
print("\n[5/6] Training models...")

rf = RandomForestRegressor(
    n_estimators=300, max_depth=20, min_samples_split=2,
    min_samples_leaf=1, max_features='sqrt',
    random_state=42, n_jobs=-1
)
rf.fit(X_train, y_train)
rf_r2  = r2_score(y_test, rf.predict(X_test))
rf_mae = mean_absolute_error(y_test, rf.predict(X_test))
print(f"    Random Forest   — R²: {rf_r2:.4f} | MAE: {rf_mae:.1f} hg/ha")

gb = GradientBoostingRegressor(
    n_estimators=300, learning_rate=0.05, max_depth=6,
    subsample=0.8, random_state=42
)
gb.fit(X_train, y_train)
gb_r2  = r2_score(y_test, gb.predict(X_test))
gb_mae = mean_absolute_error(y_test, gb.predict(X_test))
print(f"    Gradient Boost  — R²: {gb_r2:.4f} | MAE: {gb_mae:.1f} hg/ha")

# Pick best
if rf_r2 >= gb_r2:
    model, r2, mae, model_name = rf, rf_r2, rf_mae, 'Random Forest'
else:
    model, r2, mae, model_name = gb, gb_r2, gb_mae, 'Gradient Boosting'

print(f"\n    ✓ Best: {model_name} — R²: {r2:.4f} | MAE: {mae:.1f} hg/ha")

# Cross-validation
cv_scores = cross_val_score(rf, X, y,
                             cv=KFold(n_splits=5, shuffle=True, random_state=42),
                             scoring='r2', n_jobs=-1)
print(f"\n    5-Fold CV R²: {[f'{s:.4f}' for s in cv_scores]}")
print(f"    CV Mean: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── Evaluate ──────────────────────────────────────────────────────────────────
print("\n[6/6] Final evaluation...")
y_pred = model.predict(X_test)
final_r2   = r2_score(y_test, y_pred)
final_mae  = mean_absolute_error(y_test, y_pred)
final_rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"\n    R²   : {final_r2:.4f}  (1.0 = perfect)")
print(f"    MAE  : {final_mae:.2f} hg/ha")
print(f"    RMSE : {final_rmse:.2f} hg/ha")

print("\n    Feature Importances:")
for feat, imp in sorted(zip(FEATURES, rf.feature_importances_), key=lambda x: -x[1]):
    print(f"    {'█' * int(imp*50):50s} {feat:25s} {imp:.4f}")

# Actual vs Predicted scatter plot
try:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Scatter: actual vs predicted
    axes[0].scatter(y_test, y_pred, alpha=0.3, s=10, color='#22c55e')
    mn, mx = y_test.min(), y_test.max()
    axes[0].plot([mn, mx], [mn, mx], 'r--', lw=1.5, label='Perfect fit')
    axes[0].set_xlabel('Actual Yield (hg/ha)')
    axes[0].set_ylabel('Predicted Yield (hg/ha)')
    axes[0].set_title(f'Actual vs Predicted\nR² = {final_r2:.4f}')
    axes[0].legend()

    # Feature importance bar
    imp_sorted = sorted(zip(FEATURES, rf.feature_importances_), key=lambda x: x[1])
    axes[1].barh([f for f, _ in imp_sorted], [i for _, i in imp_sorted], color='#3b82f6')
    axes[1].set_xlabel('Importance')
    axes[1].set_title('Feature Importance')

    plt.tight_layout()
    plot_path = os.path.join(MODEL_DIR, 'yield_evaluation.png')
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\n    Evaluation plot → ml_models/yield_evaluation.png")
except Exception as e:
    print(f"    (Plot skipped: {e})")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump(model,    os.path.join(MODEL_DIR, 'yield_model.pkl'))
joblib.dump(rf,       os.path.join(MODEL_DIR, 'yield_rf_model.pkl'))   # for SHAP
joblib.dump(le,       os.path.join(MODEL_DIR, 'yield_encoder.pkl'))
joblib.dump(FEATURES, os.path.join(MODEL_DIR, 'yield_features.pkl'))
print(f"\n    Saved: yield_model.pkl, yield_encoder.pkl, yield_features.pkl")

# ── Sanity Check ──────────────────────────────────────────────────────────────
print("\n── Sanity Check ──")
sample_crops = le.classes_[:3]
for crop in sample_crops:
    enc = le.transform([crop])[0]
    row = pd.DataFrame([{
        'crop_encoded': enc, 'year': 2024, 'rainfall': 800.0,
        'pesticide_use': 10.0, 'temperature': 22.0,
        'rain_temp_ratio': 800/(22+1), 'pesticide_per_rain': 10/(800+1),
        'year_norm': (2024-df['year'].min())/(df['year'].max()-df['year'].min()+1)
    }])
    pred = model.predict(row[FEATURES])[0]
    print(f"    {crop:30s} → {pred:10.0f} hg/ha")

print("\n" + "=" * 60)
print(f"   DONE — R²: {final_r2:.4f} | MAE: {final_mae:.1f} hg/ha")
print("=" * 60)