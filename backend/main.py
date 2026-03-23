from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import crop, yield_pred, disease, weather, explain
import os, logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload all models at startup so first request is fast."""
    logger.info("Loading ML models...")
    try:
        crop.get_model()
        logger.info("  crop model loaded")
    except Exception as e:
        logger.warning(f"  crop model: {e}")
    try:
        yield_pred.get_model()
        logger.info("  yield model loaded")
    except Exception as e:
        logger.warning(f"  yield model: {e}")
    logger.info("All models ready. Server starting.")
    yield
    logger.info("Server shutting down.")


app = FastAPI(
    title="AI Farm Intelligence System",
    description="AI-powered agricultural decision support system",
    version="1.0.0",
    lifespan=lifespan
)

# Allow both local dev and deployed frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# Add Vercel URL and any preview URLs
if FRONTEND_URL:
    origins.append(FRONTEND_URL)
    # Also allow Vercel preview deployments (vercel.app domain)
    origins.append("https://ai-farm-frontend.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crop.router,      prefix="/api", tags=["Crop Recommendation"])
app.include_router(yield_pred.router, prefix="/api", tags=["Yield Prediction"])
app.include_router(disease.router,   prefix="/api", tags=["Disease Detection"])
app.include_router(weather.router,   prefix="/api", tags=["Weather Advisory"])
app.include_router(explain.router,   prefix="/api", tags=["Explainable AI"])


@app.get("/")
def root():
    return {"message": "AI Farm Intelligence System API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}