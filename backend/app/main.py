import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

# Mount Demo Videos directory for CCTV streaming
demo_videos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "pipeline", "demo_videos"))
if os.path.exists(demo_videos_dir):
    app.mount("/videos", StaticFiles(directory=demo_videos_dir), name="videos")
    logger.info(f"Mounted static demo videos from: {demo_videos_dir}")

# Mount Built Frontend if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
frontend_assets = os.path.join(frontend_dist, "assets")
if os.path.exists(frontend_assets):
    app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")
    logger.info(f"Mounted frontend assets from: {frontend_assets}")

@app.get("/api/info")
def api_info():
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

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If the file exists directly in frontend_dist (e.g. vite.svg, favicon.ico), serve it
    file_path = os.path.join(frontend_dist, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    # Otherwise return index.html for client-side SPA routing
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "ws_alerts_url": "/alerts"
    }
