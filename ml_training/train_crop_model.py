"""
Train crop recommendation model.
Dataset: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
Place downloaded CSV at: data/crop_recommendation.csv
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "crop_recommendation.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")
print(f"Crops: {df['label'].unique()}")

# Features and target
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET = "label"

X = df[FEATURES]
y = df[TARGET]

print(f"\nMissing values:\n{X.isnull().sum()}")
X = X.dropna()
y = y[X.index]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")

# Train Random Forest
print("\nTraining Random Forest Classifier...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {acc:.4f} ({acc*100:.2f}%)")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Feature importance
importances = model.feature_importances_
for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
    print(f"  {feat}: {imp:.4f}")

# Save model
save_path = os.path.join(MODEL_DIR, "crop_model.pkl")
joblib.dump(model, save_path)
print(f"\nModel saved to: {save_path}")

# Quick sanity check
sample = pd.DataFrame([[90, 42, 43, 20.8, 82.0, 6.5, 202.9]], columns=FEATURES)
print(f"\nSanity check prediction: {model.predict(sample)[0]}")
print("Done!")
