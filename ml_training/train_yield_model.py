"""
Train yield prediction model.
Dataset: https://www.kaggle.com/datasets/patelris/crop-yield-prediction-dataset
Place downloaded CSV at: data/yield_df.csv
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "yield_df.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(df.head())

# Clean up column names (Kaggle dataset has leading spaces sometimes)
df.columns = df.columns.str.strip()

# Rename columns to standard names (adjust if your CSV has different names)
rename_map = {
    "Area": "country",
    "Item": "crop",
    "Year": "year",
    "average_rain_fall_mm_per_year": "rainfall",
    "pesticides_tonnes": "pesticide_use",
    "avg_temp": "temperature",
    "hg/ha_yield": "yield"
}
df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns}, inplace=True)

print(f"\nUsing columns: {df.columns.tolist()}")

# Drop rows with missing yield
df = df.dropna(subset=["yield"])

# Encode crop as numeric
le = LabelEncoder()
df["crop_encoded"] = le.fit_transform(df["crop"])

print(f"\nCrops in dataset: {list(le.classes_)[:10]}... ({len(le.classes_)} total)")

FEATURES = ["crop_encoded", "year", "rainfall", "pesticide_use", "temperature"]
TARGET = "yield"

# Drop rows with any missing feature
df = df.dropna(subset=FEATURES + [TARGET])
X = df[FEATURES]
y = df[TARGET]

print(f"\nFinal dataset size: {len(X)}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train: {len(X_train)}, Test: {len(X_test)}")

print("\nTraining Random Forest Regressor...")
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=20,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"\nMAE: {mae:.2f} hg/ha")
print(f"R²:  {r2:.4f}")

# Feature importance
importances = model.feature_importances_
for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
    print(f"  {feat}: {imp:.4f}")

# Save model and encoder
model_path = os.path.join(MODEL_DIR, "yield_model.pkl")
encoder_path = os.path.join(MODEL_DIR, "yield_encoder.pkl")
joblib.dump(model, model_path)
joblib.dump(le, encoder_path)
print(f"\nModel saved to: {model_path}")
print(f"Encoder saved to: {encoder_path}")
print("Done!")
