from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io
import os
import json

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "disease_model.pth")
CLASSES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "disease_classes.json")

_model = None
_classes = None

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


def get_model():
    global _model, _classes
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=503,
                detail="disease_model.pth not found in ml_models/. Complete Colab training and copy the file there.")
        if not os.path.exists(CLASSES_PATH):
            raise HTTPException(status_code=503,
                detail="disease_classes.json not found in ml_models/. Download it from Colab along with disease_model.pth.")
        with open(CLASSES_PATH) as f:
            _classes = json.load(f)
        num_classes = len(_classes)

        # Use ResNet18 — lightweight and accurate enough for PlantVillage
        model = models.resnet18(weights=None)  # weights=None is the modern API (pretrained= is deprecated)
        model.fc = nn.Linear(model.fc.in_features, num_classes)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.eval()
        _model = model
    return _model, _classes


class DiseaseOutput(BaseModel):
    disease: str
    confidence: float
    top_3: list[dict]
    is_healthy: bool


@router.post("/detect_disease", response_model=DiseaseOutput)
async def detect_disease(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    model, classes = get_model()

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    tensor = TRANSFORM(image).unsqueeze(0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tensor = tensor.to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    top_indices = torch.topk(probabilities, 3).indices.tolist()
    top_3 = [
        {"disease": classes[i], "probability": round(float(probabilities[i]), 4)}
        for i in top_indices
    ]

    predicted_class = classes[torch.argmax(probabilities).item()]
    confidence = round(float(torch.max(probabilities).item()), 4)

    return DiseaseOutput(
        disease=predicted_class,
        confidence=confidence,
        top_3=top_3,
        is_healthy="healthy" in predicted_class.lower()
    )