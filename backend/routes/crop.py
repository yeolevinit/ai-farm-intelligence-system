from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import pandas as pd
import os

router = APIRouter()

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "crop_model.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "crop_features.pkl")

_model    = None
_features = None

def get_model():
    global _model, _features
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=503,
                detail="Crop model not found. Run ml_training/train_crop_model.py first."
            )
        _model    = joblib.load(MODEL_PATH)
        _features = joblib.load(FEATURES_PATH)
    return _model, _features


def build_features(n, p, k, temp, humidity, ph, rainfall) -> np.ndarray:
    """Build the exact same feature vector used during training (7 base + 3 engineered)."""
    npk_ratio     = n / (p + k + 1)
    temp_humidity = temp * humidity / 100
    water_need    = rainfall * humidity / 100
    return np.array([[n, p, k, temp, humidity, ph, rainfall,
                      npk_ratio, temp_humidity, water_need]])


class CropInput(BaseModel):
    nitrogen:    float = Field(..., ge=0,  le=200, description="Nitrogen (kg/ha)")
    phosphorus:  float = Field(..., ge=0,  le=200, description="Phosphorus (kg/ha)")
    potassium:   float = Field(..., ge=0,  le=200, description="Potassium (kg/ha)")
    temperature: float = Field(..., ge=0,  le=50,  description="Temperature (°C)")
    humidity:    float = Field(..., ge=0,  le=100, description="Humidity (%)")
    ph:          float = Field(..., ge=0,  le=14,  description="Soil pH")
    rainfall:    float = Field(..., ge=0,  le=500, description="Rainfall (mm)")


class CropOutput(BaseModel):
    recommended_crop: str
    confidence:       float
    top_3:            list[dict]


@router.post("/predict_crop", response_model=CropOutput)
def predict_crop(data: CropInput):
    model, features = get_model()

    X = build_features(
        data.nitrogen, data.phosphorus, data.potassium,
        data.temperature, data.humidity, data.ph, data.rainfall
    )

    prediction    = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]
    classes       = model.classes_

    top_indices = np.argsort(probabilities)[::-1][:3]
    top_3 = [
        {"crop": classes[i], "probability": round(float(probabilities[i]), 4)}
        for i in top_indices
    ]

    return CropOutput(
        recommended_crop=str(prediction),
        confidence=round(float(max(probabilities)), 4),
        top_3=top_3
    )