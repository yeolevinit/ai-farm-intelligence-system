from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import shap
import os

router = APIRouter()

CROP_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "crop_model.pkl")
YIELD_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "yield_model.pkl")

CROP_FEATURES = ["nitrogen", "phosphorus", "potassium", "temperature", "humidity", "ph", "rainfall"]
YIELD_FEATURES = ["crop_encoded", "year", "rainfall", "pesticide_use", "temperature"]


class ExplainInput(BaseModel):
    model_type: str  # "crop" or "yield"
    features: dict   # feature name -> value


class FeatureContribution(BaseModel):
    feature: str
    value: float
    shap_value: float
    direction: str  # "positive" or "negative"


class ExplainOutput(BaseModel):
    model_type: str
    prediction: str
    base_value: float
    contributions: list[FeatureContribution]
    summary: str


@router.post("/explain_prediction", response_model=ExplainOutput)
def explain_prediction(data: ExplainInput):
    if data.model_type == "crop":
        model_path = CROP_MODEL_PATH
        feature_names = CROP_FEATURES
    elif data.model_type == "yield":
        model_path = YIELD_MODEL_PATH
        feature_names = YIELD_FEATURES
    else:
        raise HTTPException(status_code=400, detail="model_type must be 'crop' or 'yield'")

    if not os.path.exists(model_path):
        raise HTTPException(status_code=503, detail=f"{data.model_type} model not trained yet.")

    model = joblib.load(model_path)

    try:
        feature_values = np.array([[data.features[f] for f in feature_names]])
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing feature: {e}")

    # SHAP TreeExplainer works natively with Random Forest
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(feature_values)

    # For classifiers shap_values is a list (one per class); pick predicted class
    if isinstance(shap_values, list):
        prediction_idx = model.predict(feature_values)[0]
        classes = model.classes_.tolist()
        class_idx = classes.index(prediction_idx)
        shap_vals = shap_values[class_idx][0]
        prediction_label = str(prediction_idx)
    else:
        shap_vals = shap_values[0]
        prediction_label = str(round(float(model.predict(feature_values)[0]), 2))

    base_value = float(explainer.expected_value[class_idx]) if isinstance(explainer.expected_value, np.ndarray) else float(explainer.expected_value)

    contributions = []
    for i, fname in enumerate(feature_names):
        sv = float(shap_vals[i])
        contributions.append(FeatureContribution(
            feature=fname,
            value=float(feature_values[0][i]),
            shap_value=round(sv, 4),
            direction="positive" if sv > 0 else "negative"
        ))

    # Sort by absolute impact
    contributions.sort(key=lambda x: abs(x.shap_value), reverse=True)

    top = contributions[0]
    summary = f"The most influential factor was {top.feature} ({'+' if top.shap_value > 0 else ''}{top.shap_value:.3f} impact)."

    return ExplainOutput(
        model_type=data.model_type,
        prediction=prediction_label,
        base_value=round(base_value, 4),
        contributions=contributions,
        summary=summary
    )
