import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "City-Wide ANPR Vehicle Tracking System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database: Supabase PostgreSQL connection string (or SQLite fallback for zero-config local testing)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./anpr_local.db"
    )
    
    # Redis for PubSub and live alert push
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_ALERT_CHANNEL: str = "alerts"
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    # Speed anomaly thresholds (km/h)
    MAX_PLAUSIBLE_SPEED_KMH: float = 140.0
    MIN_PLAUSIBLE_SPEED_KMH: float = 0.5

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
