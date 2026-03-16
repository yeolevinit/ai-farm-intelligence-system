from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "yield_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "yield_encoder.pkl")
_model = None
_encoder = None

def get_model():
    global _model, _encoder
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=503, detail="Yield model not trained yet. Run ml_training/train_yield_model.py first.")
        _model = joblib.load(MODEL_PATH)
        _encoder = joblib.load(ENCODER_PATH)
    return _model, _encoder


class YieldInput(BaseModel):
    crop: str = Field(..., description="Crop type (e.g. Wheat, Rice, Maize)")
    rainfall: float = Field(..., ge=0, description="Annual rainfall (mm)")
    temperature: float = Field(..., ge=0, le=50, description="Average temperature (°C)")
    pesticide_use: float = Field(..., ge=0, description="Pesticide use (tonnes)")
    year: int = Field(..., ge=1990, le=2030, description="Year")


class YieldOutput(BaseModel):
    predicted_yield: float
    unit: str
    crop: str


@router.post("/predict_yield", response_model=YieldOutput)
def predict_yield(data: YieldInput):
    model, encoder = get_model()

    try:
        crop_encoded = encoder.transform([data.crop])[0]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown crop '{data.crop}'. Check supported crops.")

    features = np.array([[crop_encoded, data.year, data.rainfall, data.pesticide_use, data.temperature]])
    prediction = model.predict(features)[0]

    return YieldOutput(
        predicted_yield=round(float(prediction), 2),
        unit="hg/ha",
        crop=data.crop
    )
