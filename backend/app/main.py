import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.pubsub import broadcaster
from app.seed_data import seed_database
from app.routes import cameras, trajectory, heatmap, blacklist, sightings, alerts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("anpr.backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing ANPR Database and Models...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database seed skipped or failed: {e}")
    
    logger.info("Initializing PubSub broadcaster...")
    await broadcaster.initialize()
    yield
    # Shutdown
    logger.info("Shutting down PubSub broadcaster...")
    await broadcaster.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="City-Wide ANPR Vehicle Tracking Network API with Trajectory, Heatmaps, and Real-Time WebSocket Alerts",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(cameras.router)
app.include_router(trajectory.router)
app.include_router(heatmap.router)
app.include_router(blacklist.router)
app.include_router(sightings.router)
app.include_router(alerts.router)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "ws_alerts_url": "/alerts"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
