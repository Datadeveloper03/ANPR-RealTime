from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Camera schemas
class CameraBase(BaseModel):
    name: str
    lat: float
    lon: float

class CameraCreate(CameraBase):
    pass

class CameraResponse(CameraBase):
    id: int
    total_sightings: Optional[int] = 0

    class Config:
        from_attributes = True

# Sighting schemas
class SightingBase(BaseModel):
    plate: str
    camera_id: int
    confidence: Optional[float] = 1.0

class SightingCreate(SightingBase):
    timestamp: Optional[datetime] = None

class SightingResponse(BaseModel):
    id: int
    plate: str
    camera_id: int
    camera_name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    timestamp: datetime
    confidence: float

    class Config:
        from_attributes = True

# Blacklist schemas
class BlacklistBase(BaseModel):
    plate: str
    reason: str

class BlacklistCreate(BlacklistBase):
    pass

class BlacklistResponse(BlacklistBase):
    class Config:
        from_attributes = True

# Trajectory schemas
class TrajectoryPoint(BaseModel):
    sighting_id: int
    camera_id: int
    camera_name: str
    lat: float
    lon: float
    timestamp: datetime
    confidence: float
    speed_from_prev_kmh: Optional[float] = None
    distance_from_prev_km: Optional[float] = None
    time_delta_seconds: Optional[float] = None
    is_anomaly: Optional[bool] = False
    anomaly_reason: Optional[str] = None

class TrajectoryResponse(BaseModel):
    plate: str
    is_blacklisted: bool = False
    blacklist_reason: Optional[str] = None
    total_sightings: int
    sightings: List[TrajectoryPoint]
    has_anomalies: bool = False
    anomalies: List[str] = []

# Heatmap schemas
class HeatmapPoint(BaseModel):
    lat: float
    lon: float
    intensity: float
    camera_id: int
    camera_name: str
    count: int

# Alert schemas
class AlertPayload(BaseModel):
    alert_type: str  # "BLACKLIST_HIT" | "SPEED_ANOMALY" | "ROUTE_SKIP"
    plate: str
    camera_id: int
    camera_name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    timestamp: str
    reason: str
    confidence: Optional[float] = 1.0
    speed_kmh: Optional[float] = None
