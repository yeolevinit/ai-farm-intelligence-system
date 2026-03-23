import joblib, os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

print("Loading yield training data...")
df = pd.read_csv('../data/yield_df.csv')
df.columns = df.columns.str.strip()
print("Columns found:", list(df.columns))

# Load encoder
encoder = joblib.load('../ml_models/yield_encoder.pkl')
print("Encoder classes:", list(encoder.classes_))

# Auto-detect column names
crop_col  = next(c for c in df.columns if 'crop' in c.lower() or 'item' in c.lower())
year_col  = next(c for c in df.columns if 'year' in c.lower())
rain_col  = next(c for c in df.columns if 'rain' in c.lower())
pest_col  = next(c for c in df.columns if 'pest' in c.lower())
temp_col  = next(c for c in df.columns if 'temp' in c.lower())
yield_col = next(c for c in df.columns if 'yield' in c.lower() or 'value' in c.lower())

print(f"Using columns: crop={crop_col}, year={year_col}, rain={rain_col}, pest={pest_col}, temp={temp_col}, yield={yield_col}")

# Filter to supported crops only
df = df[df[crop_col].isin(encoder.classes_)].copy()
print(f"Rows after filtering: {len(df)}")

# Encode crop
df['crop_encoded'] = encoder.transform(df[crop_col])

# Rename to standard names
df = df.rename(columns={
    year_col:  'year',
    rain_col:  'rainfall',
    pest_col:  'pesticide_use',
    temp_col:  'temperature',
    yield_col: 'yield_val'
})

# Engineered features
df['rain_temp_ratio']    = df['rainfall'] / (df['temperature'] + 1)
df['pesticide_per_rain'] = df['pesticide_use'] / (df['rainfall'] + 1)
df['year_norm']          = (df['year'] - 1990) / (2013 - 1990 + 1)

features = ['crop_encoded', 'year', 'rainfall', 'pesticide_use', 'temperature',
            'rain_temp_ratio', 'pesticide_per_rain', 'year_norm']

X = df[features]
y = df['yield_val']

print("\nTraining lightweight Random Forest (50 trees, max_depth=15)...")
rf_light = RandomForestRegressor(
    n_estimators=50,
    max_depth=15,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1
)
rf_light.fit(X, y)
print("Training complete!")

# Save with compression to reduce file size
out_path = '../ml_models/yield_rf_model.pkl'
joblib.dump(rf_light, out_path, compress=3)

size_mb = os.path.getsize(out_path) / (1024 * 1024)
r2 = r2_score(y, rf_light.predict(X))

print(f"\n✅ Saved to {out_path}")
print(f"📦 New file size: {size_mb:.1f} MB")
print(f"📊 R² score: {r2:.4f}")

if size_mb < 100:
    print("✅ File is under 100MB — safe to push to GitHub!")
else:
    print("⚠️ Still too large — we need to reduce further")