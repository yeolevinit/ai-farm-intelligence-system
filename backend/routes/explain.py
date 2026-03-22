from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os

router = APIRouter()

CROP_RF_PATH    = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "crop_rf_model.pkl")
YIELD_RF_PATH   = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "yield_rf_model.pkl")
CROP_FEAT_PATH  = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "crop_features.pkl")
YIELD_FEAT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "yield_features.pkl")
YIELD_ENC_PATH  = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "yield_encoder.pkl")

_cache = {}

def _load(key, path):
    if key not in _cache:
        if not os.path.exists(path):
            raise HTTPException(status_code=503, detail=f"File not found: {path}")
        _cache[key] = joblib.load(path)
    return _cache[key]


class ExplainInput(BaseModel):
    model_type: str
    features:   dict

class FeatureContribution(BaseModel):
    feature:    str
    value:      float
    shap_value: float
    direction:  str

class ExplainOutput(BaseModel):
    model_type:    str
    prediction:    str
    base_value:    float
    contributions: list[FeatureContribution]
    summary:       str


def _crop_feature_vector(f: dict) -> np.ndarray:
    n, p, k    = f["nitrogen"], f["phosphorus"], f["potassium"]
    temp       = f["temperature"]
    humidity   = f["humidity"]
    ph         = f["ph"]
    rainfall   = f["rainfall"]
    npk_ratio  = n / (p + k + 1)
    temp_hum   = temp * humidity / 100
    water_need = rainfall * humidity / 100
    return np.array([[n, p, k, temp, humidity, ph, rainfall,
                      npk_ratio, temp_hum, water_need]])


def _yield_feature_vector(f: dict, encoder) -> np.ndarray:
    crop_name = f["crop"]
    year      = f["year"]
    rainfall  = f["rainfall"]
    pesticide = f["pesticide_use"]
    temp      = f["temperature"]
    match = next((c for c in encoder.classes_
                  if c.lower() == str(crop_name).lower()), None)
    if match is None:
        raise HTTPException(status_code=400, detail=f"Unknown crop '{crop_name}'.")
    crop_enc           = float(encoder.transform([match])[0])
    rain_temp_ratio    = rainfall / (temp + 1)
    pesticide_per_rain = pesticide / (rainfall + 1)
    year_norm          = (year - 1990) / (2013 - 1990 + 1)
    return np.array([[crop_enc, year, rainfall, pesticide, temp,
                      rain_temp_ratio, pesticide_per_rain, year_norm]])


def _extract_shap(explainer, shap_values, class_idx=None):
    """
    Handles every shap output format across versions.
    Classifier: class_idx is int
    Regressor:  class_idx is None
    """
    sv = shap_values
    ev = explainer.expected_value

    if class_idx is not None:
        # --- Classifier ---
        if isinstance(sv, list):
            # Old shap: list[n_classes] each shape (n_samples, n_features)
            shap_row = np.array(sv[class_idx])[0]
            base     = float(np.array(ev).flat[class_idx])
        else:
            arr = np.array(sv)
            if arr.ndim == 3:
                # New shap: (n_samples, n_features, n_classes)
                shap_row = arr[0, :, class_idx]
            elif arr.ndim == 2:
                # (n_features, n_classes) when squeezed
                shap_row = arr[:, class_idx]
            else:
                shap_row = arr[0]
            ev_arr = np.array(ev).flatten()
            base   = float(ev_arr[class_idx]) if len(ev_arr) > class_idx else float(ev_arr[0])
    else:
        # --- Regressor ---
        arr      = np.array(sv)
        shap_row = arr[0] if arr.ndim == 2 else arr.flatten()
        base     = float(np.array(ev).flat[0])

    return shap_row.flatten(), base


@router.post("/explain_prediction", response_model=ExplainOutput)
def explain_prediction(data: ExplainInput):
    try:
        import shap
    except ImportError:
        raise HTTPException(status_code=500, detail="shap not installed.")

    if data.model_type == "crop":
        model         = _load("crop_rf",    CROP_RF_PATH)
        feature_names = _load("crop_feat",  CROP_FEAT_PATH)
        X             = _crop_feature_vector(data.features)
        prediction    = model.predict(X)[0]
        class_idx     = model.classes_.tolist().index(prediction)
        pred_label    = str(prediction)
        explainer     = shap.TreeExplainer(model)
        shap_values   = explainer.shap_values(X)
        shap_vals, base_val = _extract_shap(explainer, shap_values, class_idx=class_idx)

    elif data.model_type == "yield":
        model         = _load("yield_rf",   YIELD_RF_PATH)
        feature_names = _load("yield_feat", YIELD_FEAT_PATH)
        encoder       = _load("yield_enc",  YIELD_ENC_PATH)
        X             = _yield_feature_vector(data.features, encoder)
        pred_label    = str(round(float(model.predict(X)[0]), 2))
        explainer     = shap.TreeExplainer(model)
        shap_values   = explainer.shap_values(X)
        shap_vals, base_val = _extract_shap(explainer, shap_values, class_idx=None)

    else:
        raise HTTPException(status_code=400, detail="model_type must be 'crop' or 'yield'")

    contributions = []
    for i, fname in enumerate(feature_names):
        sv = float(shap_vals[i])
        contributions.append(FeatureContribution(
            feature=fname,
            value=round(float(X[0][i]), 4),
            shap_value=round(sv, 4),
            direction="positive" if sv >= 0 else "negative"
        ))

    contributions.sort(key=lambda x: abs(x.shap_value), reverse=True)
    top     = contributions[0]
    sign    = "+" if top.shap_value >= 0 else ""
    summary = (f"The most influential factor was '{top.feature}' "
               f"({sign}{top.shap_value:.3f} impact on the prediction).")

    return ExplainOutput(
        model_type=data.model_type,
        prediction=pred_label,
        base_value=round(base_val, 4),
        contributions=contributions,
        summary=summary
    )