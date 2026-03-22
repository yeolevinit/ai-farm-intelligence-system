from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

router = APIRouter()

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "yield_model.pkl")
ENCODER_PATH  = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "yield_encoder.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "yield_features.pkl")

_model    = None
_encoder  = None
_features = None
_year_min = 1990   # matches training data range
_year_max = 2013

def get_model():
    global _model, _encoder, _features
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=503,
                detail="Yield model not found. Run ml_training/train_yield_model.py first."
            )
        _model    = joblib.load(MODEL_PATH)
        _encoder  = joblib.load(ENCODER_PATH)
        _features = joblib.load(FEATURES_PATH)
    return _model, _encoder, _features


def build_features(crop_encoded, year, rainfall, pesticide_use, temperature) -> np.ndarray:
    """Build the exact same 8-feature vector used during training."""
    rain_temp_ratio    = rainfall / (temperature + 1)
    pesticide_per_rain = pesticide_use / (rainfall + 1)
    year_norm          = (year - _year_min) / (_year_max - _year_min + 1)
    return np.array([[
        crop_encoded, year, rainfall, pesticide_use, temperature,
        rain_temp_ratio, pesticide_per_rain, year_norm
    ]])


class YieldInput(BaseModel):
    crop:          str   = Field(..., description="Crop name — must match training data")
    year:          int   = Field(..., ge=1990, le=2030, description="Year")
    rainfall:      float = Field(..., ge=0,   description="Annual rainfall (mm)")
    temperature:   float = Field(..., ge=0,   le=50,   description="Avg temperature (°C)")
    pesticide_use: float = Field(..., ge=0,   description="Pesticide use (tonnes)")


class YieldOutput(BaseModel):
    predicted_yield: float
    unit:            str
    crop:            str
    supported_crops: list[str]


@router.post("/predict_yield", response_model=YieldOutput)
def predict_yield(data: YieldInput):
    model, encoder, features = get_model()

    supported = sorted(encoder.classes_.tolist())

    # Case-insensitive crop matching
    crop_match = next(
        (c for c in encoder.classes_ if c.lower() == data.crop.lower()), None
    )
    if crop_match is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown crop '{data.crop}'. Supported: {supported}"
        )

    crop_encoded = encoder.transform([crop_match])[0]
    X            = build_features(crop_encoded, data.year, data.rainfall,
                                  data.pesticide_use, data.temperature)

    prediction = model.predict(X)[0]

    return YieldOutput(
        predicted_yield=round(float(prediction), 2),
        unit="hg/ha",
        crop=crop_match,
        supported_crops=supported
    )


@router.get("/supported_crops")
def get_supported_crops():
    """Returns list of crops the yield model was trained on."""
    _, encoder, _ = get_model()
    return {"crops": sorted(encoder.classes_.tolist())}