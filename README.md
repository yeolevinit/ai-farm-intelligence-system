# 🌾 AI Farm Intelligence System

An end-to-end AI-powered agricultural decision support system built with React, FastAPI, scikit-learn, PyTorch, and SHAP.

---

## Features

| Feature | Model | Dataset |
|---|---|---|
| Crop Recommendation | Random Forest Classifier | Kaggle Crop Recommendation Dataset |
| Yield Prediction | Random Forest Regressor | Kaggle Crop Yield Dataset |
| Disease Detection | ResNet18 CNN (PyTorch) | PlantVillage (54k images, 38 diseases) |
| Weather Advisory | Rule-based + OpenWeatherMap API | Live data |
| Explainable AI | SHAP TreeExplainer | — |

---

## Project Structure

```
ai-farm-intelligence-system/
├── frontend/               # React app
│   ├── src/
│   │   ├── pages/          # CropRecommendation, YieldPrediction, DiseaseDetection, WeatherAdvisory, Dashboard
│   │   ├── api/            # Axios API client
│   │   └── styles/         # App.css
│   └── package.json
├── backend/                # FastAPI app
│   ├── main.py
│   ├── routes/
│   │   ├── crop.py         # POST /api/predict_crop
│   │   ├── yield_pred.py   # POST /api/predict_yield
│   │   ├── disease.py      # POST /api/detect_disease
│   │   ├── weather.py      # GET  /api/weather
│   │   └── explain.py      # POST /api/explain_prediction
│   └── requirements.txt
├── ml_training/
│   ├── train_crop_model.py
│   ├── train_yield_model.py
│   └── train_disease_model.py   # Run on Google Colab (GPU)
├── ml_models/              # Saved .pkl and .pth files (generated after training)
├── data/                   # CSV datasets and PlantVillage images
└── deployment/
    └── Dockerfile
```

---

## Quick Start

### Step 1 — Get Datasets

| Dataset | Kaggle URL | Save as |
|---|---|---|
| Crop Recommendation | https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset | `data/crop_recommendation.csv` |
| Crop Yield | https://www.kaggle.com/datasets/patelris/crop-yield-prediction-dataset | `data/yield_df.csv` |
| PlantVillage | https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset | `data/plantvillage/` |

### Step 2 — Get API Keys

- Sign up at [openweathermap.org](https://openweathermap.org/api)
- Copy your API key into `backend/.env`:
  ```
  OPENWEATHER_API_KEY=your_key_here
  ```

### Step 3 — Train ML Models

```bash
cd backend
pip install -r requirements.txt

# Train crop model (~1 min)
python ../ml_training/train_crop_model.py

# Train yield model (~2 min)
python ../ml_training/train_yield_model.py

# Train disease CNN — use Google Colab for GPU speed!
# Upload ml_training/train_disease_model.py to Colab
# Runtime > Change runtime type > T4 GPU
# Expected: ~30 min, ~96% accuracy
```

### Step 4 — Run Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
# API docs available at http://localhost:8000/docs
```

### Step 5 — Run Frontend

```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/predict_crop` | Recommend best crop for given conditions |
| POST | `/api/predict_yield` | Predict crop yield in hg/ha |
| POST | `/api/detect_disease` | Detect plant disease from leaf image |
| GET | `/api/weather?city=Pune` | Weather data + farming advisories |
| POST | `/api/explain_prediction` | SHAP feature importance explanation |

Full interactive docs at: `http://localhost:8000/docs`

---

## Deployment

### Backend → Render

1. Push repo to GitHub
2. New Web Service on Render → connect repo
3. Build command: `pip install -r backend/requirements.txt`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add env variable: `OPENWEATHER_API_KEY`

### Frontend → Vercel

1. New project on Vercel → connect repo → set root to `frontend/`
2. Add env variable: `REACT_APP_API_URL=https://your-render-url.onrender.com`

---

## Skills Demonstrated

- Machine Learning (Random Forest, Regression)
- Deep Learning (CNN, Transfer Learning with ResNet18)
- Explainable AI (SHAP)
- Full Stack Development (React + FastAPI)
- REST API Design
- Data Visualisation (Plotly)
- Docker + Cloud Deployment
