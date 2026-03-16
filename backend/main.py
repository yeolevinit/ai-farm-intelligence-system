from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import crop, yield_pred, disease, weather, explain

app = FastAPI(
    title="AI Farm Intelligence System",
    description="AI-powered agricultural decision support system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crop.router, prefix="/api", tags=["Crop Recommendation"])
app.include_router(yield_pred.router, prefix="/api", tags=["Yield Prediction"])
app.include_router(disease.router, prefix="/api", tags=["Disease Detection"])
app.include_router(weather.router, prefix="/api", tags=["Weather Advisory"])
app.include_router(explain.router, prefix="/api", tags=["Explainable AI"])


@app.get("/")
def root():
    return {"message": "AI Farm Intelligence System API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
