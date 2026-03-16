from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

router = APIRouter()

# Load model once at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "crop_model.pkl")
_model = None

def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=503, detail="Crop model not trained yet. Run ml_training/train_crop_model.py first.")
        _model = joblib.load(MODEL_PATH)
    return _model


class CropInput(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200, description="Nitrogen level (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus level (kg/ha)")
    potassium: float = Field(..., ge=0, le=200, description="Potassium level (kg/ha)")
    temperature: float = Field(..., ge=0, le=50, description="Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    rainfall: float = Field(..., ge=0, le=500, description="Rainfall (mm)")


class CropOutput(BaseModel):
    recommended_crop: str
    confidence: float
    top_3: list[dict]


@router.post("/predict_crop", response_model=CropOutput)
def predict_crop(data: CropInput):
    model = get_model()
    features = np.array([[
        data.nitrogen, data.phosphorus, data.potassium,
        data.temperature, data.humidity, data.ph, data.rainfall
    ]])
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    classes = model.classes_

    top_indices = np.argsort(probabilities)[::-1][:3]
    top_3 = [
        {"crop": classes[i], "probability": round(float(probabilities[i]), 4)}
        for i in top_indices
    ]

    return CropOutput(
        recommended_crop=prediction,
        confidence=round(float(max(probabilities)), 4),
        top_3=top_3
    )
