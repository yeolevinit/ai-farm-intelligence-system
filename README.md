<div align="center">

# 🌾 AI Farm Intelligence System

### End-to-end AI decision support platform for modern agriculture

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.3-EE4C2C?style=flat-square&logo=pytorch)](https://pytorch.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**5 AI models · 99.55% crop accuracy · R² 0.96 yield model · 38 diseases detected**

[Live Demo](#) · [API Docs](#api-endpoints) · [Quick Start](#quick-start)

</div>

---

## 📌 What is this?

Farmers across India and the world lose billions every year to **wrong crop selection**, **late disease detection**, and **poor weather-based decisions**. This system solves all three problems in one platform.

**AI Farm Intelligence** combines 5 machine learning models into a single full-stack web application that gives farmers, agriculture students, and researchers instant AI-powered insights — with no technical knowledge required.

| Problem | Solution | Model | Accuracy |
|---|---|---|---|
| Wrong crop for soil conditions | Recommends best crop from NPK, pH, climate | Random Forest Classifier | **99.55%** |
| Cannot predict harvest early | Predicts yield in hg/ha before sowing | Gradient Boosting Regressor | **R² 0.96** |
| Disease spotted too late | Diagnoses disease from a single leaf photo | ResNet18 CNN (PyTorch) | **~96%** |
| Ignoring weather before farming | AI advisories for irrigation, spraying, harvest | OpenWeatherMap API | Live data |
| AI decisions feel like a black box | Shows which factors drove each prediction | SHAP TreeExplainer | All models |

---

## ✨ Features

### 🌱 Crop Recommendation
- Enter soil NPK, pH, temperature, humidity, rainfall
- Random Forest Classifier (99.55% accuracy) recommends the best crop
- Confidence score + top 3 crop candidates with probability bars
- **SHAP explanation** showing which soil factor influenced the decision most
- Growing tips (best season, water needs) specific to the recommended crop
- Quick presets for Rice, Wheat, Coffee, Cotton conditions

### 📈 Yield Prediction
- Select crop, enter rainfall, temperature, pesticide use, year
- Gradient Boosting Regressor predicts expected yield in hg/ha
- **Multi-year projection chart** (2000–2013) with national average comparison line
- Above / Below / Near average badge with contextual farming tip
- SHAP feature impact chart showing what drives yield up or down
- Plain-English explanation of what hg/ha means with tonnes/ha conversion

### 🦠 Disease Detection
- Upload any leaf photo (JPG, PNG)
- ResNet18 CNN trained on 54,000 PlantVillage images classifies across **38 diseases**
- Confidence score with top 3 predictions
- **Treatment recommendations** (specific fungicide / bactericide)
- **Prevention tips** for each detected disease
- Supports: Tomato, Potato, Maize, Grape, Apple, Peach, Bell Pepper, Strawberry and more

### 🌤️ Weather Advisory
- Search any city for live weather data
- AI generates **stacked farming advisories** based on temperature, humidity, wind
- Temperature context badge (Ideal / Warm / Hot / Cold) with crop-specific advice
- **Indian farming seasons calendar** (Kharif, Rabi, Zaid) with crop guidance
- What each weather reading means for your farm — explained in plain language

### 🧠 Explainable AI (Dedicated Page)
- Standalone SHAP analysis page for both Crop and Yield models
- Animated waterfall chart showing each feature's positive/negative impact
- Base value, total SHAP contribution, strongest driver label
- Model toggle (Random Forest vs Gradient Boosting)
- 3 quick presets per model for instant exploration

### 🏠 Dashboard
- Soil Nutrient Radar Chart with 6 sliders — live radar updates as you drag
- Soil health score (Excellent / Good / Fair / Poor) based on ideal ranges
- Impact statistics: 500M+ farmers, 30% crop loss, 5 AI models, <1s predictions
- **Problems section**: what goes wrong and how AI fixes it — side by side
- **How to use**: step-by-step guide for any farmer with zero tech knowledge
- **Who is it for**: Farmers, Agriculture students, Researchers

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 11.2 | Page transitions + scroll animations |
| Chart.js | 4.4 | Radar chart, line chart |
| Lucide React | 0.383 | Icons |
| Axios | 1.7 | HTTP client |
| React Router | 6.23 | Client-side routing |
| React Dropzone | 14.2 | Leaf image upload |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111 | REST API framework |
| scikit-learn | 1.5 | Crop + Yield ML models |
| PyTorch | 2.3 | ResNet18 CNN disease model |
| torchvision | 0.18 | Image transforms + model weights |
| SHAP | 0.45 | Explainability (TreeExplainer) |
| httpx | 0.27 | Async OpenWeatherMap requests |
| pandas | 2.2 | Feature engineering |
| Pillow | 10.3 | Image processing |

### ML Models
| Model | Algorithm | Dataset | Result |
|---|---|---|---|
| Crop recommendation | Random Forest (200 trees) + Voting Ensemble | 2,200 samples, 22 crops | **99.55% accuracy** |
| Yield prediction | Gradient Boosting Regressor | 28,242 samples, 10 crops, 1990–2013 | **R² 0.9617, MAE 9,686 hg/ha** |
| Disease detection | ResNet18 CNN (Transfer Learning) | PlantVillage 54k images, 38 classes | **~96% validation accuracy** |

---

## 📁 Project Structure

```
ai-farm-intelligence-system/
│
├── frontend/                        # React + Tailwind app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js         # Home — radar chart, problems, how-to guide
│   │   │   ├── CropRecommendation.js# Soil inputs → best crop + SHAP
│   │   │   ├── YieldPrediction.js   # Climate inputs → yield + chart + SHAP
│   │   │   ├── DiseaseDetection.js  # Leaf upload → disease + treatment
│   │   │   ├── WeatherAdvisory.js   # City search → weather + advisories
│   │   │   └── Explainability.js    # Dedicated SHAP analysis page
│   │   ├── api/
│   │   │   └── index.js             # Axios API functions
│   │   ├── styles/
│   │   │   └── App.css              # Tailwind + CSS variables (dark mode tokens)
│   │   ├── App.js                   # Router + navbar + dark mode toggle
│   │   └── index.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── backend/                         # FastAPI app
│   ├── main.py                      # App setup, CORS, model preloading
│   ├── routes/
│   │   ├── crop.py                  # POST /api/predict_crop
│   │   ├── yield_pred.py            # POST /api/predict_yield + GET /api/supported_crops
│   │   ├── disease.py               # POST /api/detect_disease
│   │   ├── weather.py               # GET  /api/weather?city=
│   │   └── explain.py               # POST /api/explain_prediction
│   ├── .env.example                 # Template for environment variables
│   ├── test_api.py                  # API test suite (6 endpoints)
│   └── requirements.txt
│
├── ml_training/                     # Training scripts
│   ├── train_crop_model.py          # Trains Random Forest crop model (~1 min)
│   ├── train_yield_model.py         # Trains Gradient Boosting yield model (~2 min)
│   ├── train_disease_model.py       # Local training (CPU, slow)
│   └── train_disease_colab.ipynb    # GPU training on Google Colab (recommended)
│
├── ml_models/                       # Saved model files (generated after training)
│   ├── crop_model.pkl               # Voting ensemble for prediction
│   ├── crop_rf_model.pkl            # Random Forest for SHAP
│   ├── crop_features.pkl            # Feature names list
│   ├── yield_model.pkl              # Gradient Boosting for prediction
│   ├── yield_rf_model.pkl           # Random Forest for SHAP
│   ├── yield_encoder.pkl            # Label encoder for crop names
│   ├── yield_features.pkl           # Feature names list
│   ├── disease_model.pth            # ResNet18 weights (from Colab)
│   └── disease_classes.json         # 38 class names in training order
│
├── data/                            # Datasets (not committed — see setup)
│   ├── crop_recommendation.csv
│   └── yield_df.csv
│
├── deployment/
│   └── Dockerfile
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Step 1 — Clone the repository

```bash
git clone https://github.com/yourusername/ai-farm-intelligence-system.git
cd ai-farm-intelligence-system
```

### Step 2 — Get datasets

Download from Kaggle and place in `data/`:

| Dataset | Kaggle URL | Save as |
|---|---|---|
| Crop Recommendation | [atharvaingle/crop-recommendation-dataset](https://kaggle.com/datasets/atharvaingle/crop-recommendation-dataset) | `data/crop_recommendation.csv` |
| Crop Yield | [patelris/crop-yield-prediction-dataset](https://kaggle.com/datasets/patelris/crop-yield-prediction-dataset) | `data/yield_df.csv` |
| PlantVillage | [abdallahalidev/plantvillage-dataset](https://kaggle.com/datasets/abdallahalidev/plantvillage-dataset) | `data/plantvillage/` |

### Step 3 — Set up the backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4 — Configure environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your OpenWeatherMap key
# Get a free key at: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_key_here
```

### Step 5 — Train the ML models

```bash
# Train crop recommendation model (~1 min, CPU)
python ../ml_training/train_crop_model.py

# Train yield prediction model (~2 min, CPU)
python ../ml_training/train_yield_model.py

# Train disease CNN — GPU required, use Google Colab:
# 1. Open ml_training/train_disease_colab.ipynb in Colab
# 2. Runtime → Change runtime type → T4 GPU
# 3. Run all cells (~30 min)
# 4. Download disease_model.pth and disease_classes.json
# 5. Place both in ml_models/
```

Expected output after training:
```
✅ crop_model.pkl         (crop recommendation)
✅ crop_rf_model.pkl      (for SHAP)
✅ crop_features.pkl
✅ yield_model.pkl        (yield prediction)
✅ yield_rf_model.pkl     (for SHAP)
✅ yield_encoder.pkl
✅ yield_features.pkl
✅ disease_model.pth      (from Colab)
✅ disease_classes.json   (from Colab)
```

### Step 6 — Start the backend

```bash
cd backend
.\venv\Scripts\uvicorn.exe main:app --port 8000   # Windows
# OR
uvicorn main:app --port 8000                       # Mac/Linux

# ✅ API running at http://localhost:8000
# ✅ Interactive docs at http://localhost:8000/docs
```

### Step 7 — Start the frontend

```bash
cd frontend
npm install
npm start

# ✅ App running at http://localhost:3001
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| GET | `/health` | Health check | — |
| POST | `/api/predict_crop` | Recommend best crop | `{nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall}` |
| POST | `/api/predict_yield` | Predict yield in hg/ha | `{crop, year, rainfall, temperature, pesticide_use}` |
| GET | `/api/supported_crops` | List yield model crops | — |
| POST | `/api/detect_disease` | Detect plant disease | `multipart/form-data: file` |
| GET | `/api/weather?city=Pune` | Weather + farming advisories | — |
| POST | `/api/explain_prediction` | SHAP feature importance | `{model_type, features}` |

### Example — Crop Recommendation

```bash
curl -X POST http://localhost:8000/api/predict_crop \
  -H "Content-Type: application/json" \
  -d '{"nitrogen":90,"phosphorus":42,"potassium":43,"temperature":20.8,"humidity":82,"ph":6.5,"rainfall":202}'
```

```json
{
  "recommended_crop": "rice",
  "confidence": 0.9955,
  "top_3": [
    {"crop": "rice",   "probability": 0.9955},
    {"crop": "jute",   "probability": 0.0030},
    {"crop": "cotton", "probability": 0.0010}
  ]
}
```

### Example — SHAP Explanation

```bash
curl -X POST http://localhost:8000/api/explain_prediction \
  -H "Content-Type: application/json" \
  -d '{"model_type":"crop","features":{"nitrogen":90,"phosphorus":42,"potassium":43,"temperature":20.8,"humidity":82,"ph":6.5,"rainfall":202}}'
```

```json
{
  "model_type": "crop",
  "prediction": "rice",
  "base_value": -1.2341,
  "contributions": [
    {"feature": "humidity",   "value": 82.0, "shap_value": 1.8420, "direction": "positive"},
    {"feature": "rainfall",   "value": 202.0,"shap_value": 1.2310, "direction": "positive"},
    {"feature": "temperature","value": 20.8, "shap_value": 0.8901, "direction": "positive"}
  ],
  "summary": "The most influential factor was 'humidity' (+1.842 impact on the prediction)."
}
```

---

## 🌐 Deployment

### Backend → Render (Free tier)

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect your repo
3. Set these values:
   - **Build command:** `pip install -r backend/requirements.txt`
   - **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `OPENWEATHER_API_KEY` = your key
   - `FRONTEND_URL` = your Vercel URL (after deploying frontend)

> ⚠️ ml_models/ folder must be committed or uploaded via Render disk — model files are required at runtime.

### Frontend → Vercel (Free tier)

1. Go to [vercel.com](https://vercel.com) → New Project → connect your repo
2. Set **Root Directory** to `frontend/`
3. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-app-name.onrender.com`
4. Update `frontend/src/api/index.js`:
   ```js
   baseURL: process.env.REACT_APP_API_URL
     ? `${process.env.REACT_APP_API_URL}/api`
     : '/api',
   ```

### Docker (Self-hosted)

```bash
docker build -f deployment/Dockerfile -t farm-ai .
docker run -p 8000:8000 \
  -e OPENWEATHER_API_KEY=your_key \
  -e FRONTEND_URL=http://localhost:3000 \
  farm-ai
```

---

## 📊 Model Details

### Crop Recommendation — Random Forest

- **Dataset:** 2,200 samples, 22 crop classes
- **Features (10):** nitrogen, phosphorus, potassium, temperature, humidity, pH, rainfall + 3 engineered (NPK ratio, temp-humidity interaction, water need index)
- **Architecture:** Voting ensemble (RandomForest + GradientBoosting + LogisticRegression)
- **Result:** 99.55% test accuracy

### Yield Prediction — Gradient Boosting

- **Dataset:** 28,242 samples, 10 crop types, years 1990–2013
- **Features (8):** crop (encoded), year, rainfall, pesticide use, temperature + 3 engineered (rain-temp ratio, pesticide-per-rain, normalised year)
- **Result:** R² = 0.9617, MAE = 9,686 hg/ha

### Disease Detection — ResNet18 CNN

- **Dataset:** PlantVillage — 54,305 images, 38 classes
- **Architecture:** ResNet18 pretrained on ImageNet, final FC layer replaced for 38-class output
- **Training:** Google Colab T4 GPU, ~30 epochs, data augmentation (random flip, rotation, color jitter)
- **Input:** 224×224 RGB, normalized with ImageNet mean/std
- **Result:** ~96% validation accuracy

---

## 🧪 Running Tests

```bash
cd backend
python test_api.py
```

Expected output:
```
Testing AI Farm Intelligence System API
========================================
✅ Health check passed
✅ Crop prediction passed — recommended: rice (99.6% confidence)
✅ Yield prediction passed — 23,456 hg/ha
✅ Supported crops passed — 10 crops
✅ SHAP explanation passed — humidity most influential
✅ Weather advisory passed — 3 advisories generated
========================================
6/6 tests passed
```

---

## 🛠️ Development Notes

**Adding a new crop to yield model:** Re-train `train_yield_model.py` with updated dataset. The encoder handles new crop names automatically.

**Improving disease model accuracy:** Increase epochs in Colab notebook, add more augmentation, or switch to ResNet50 for higher capacity.

**Extending weather advisories:** Edit `generate_advisory()` in `backend/routes/weather.py` — all conditions stack independently.

**Dark mode:** Controlled via `data-theme="dark"` on `<html>` element, persisted to `localStorage`. CSS variables in `App.css` handle all color switching.

---

## 📄 Skills Demonstrated

- **Machine Learning** — Random Forest, Gradient Boosting, feature engineering, model evaluation
- **Deep Learning** — CNN, Transfer Learning (ResNet18), image classification, PyTorch
- **Explainable AI** — SHAP TreeExplainer, feature importance, waterfall charts
- **Full Stack Development** — React 18, FastAPI, REST API design, async endpoints
- **Data Visualisation** — Chart.js radar chart, line chart, animated SHAP bars
- **Frontend Engineering** — Tailwind CSS, Framer Motion animations, dark mode, responsive design
- **MLOps** — Model serialisation (joblib, torch.save), model preloading, error handling
- **Cloud Deployment** — Docker, Render, Vercel, environment variables, CORS configuration

---

## 👤 Author

**Vinit** — Pre-Final Year B.E. (AI & Data Science)

Built as a Pre-Final year project demonstrating end-to-end AI system design from raw data to production deployment.

---

## 📃 License

MIT License — free to use, modify and distribute.

---

<div align="center">
  <sub>Built with ❤️ using React · FastAPI · scikit-learn · PyTorch · SHAP</sub>
</div>