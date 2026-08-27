from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

# Camera schemas
class CameraBase(BaseModel):
    name: str
    lat: float
    lon: float
    place_name: Optional[str] = "Bangalore Central"
    zone_type: Optional[str] = "STANDARD"
    direction: Optional[str] = "NORTH"
    max_dwell_minutes: Optional[float] = 5.0

class CameraCreate(CameraBase):
    pass

class CameraResponse(CameraBase):
    id: int
    total_sightings: Optional[int] = 0
    video_url: Optional[str] = None
    video_filename: Optional[str] = None

    class Config:
        from_attributes = True

# Sighting schemas
class SightingBase(BaseModel):
    plate: str
    camera_id: int
    confidence: Optional[float] = 1.0
    vehicle_type: Optional[str] = "SEDAN"
    vehicle_color: Optional[str] = "WHITE"
    make: Optional[str] = "GENERIC"

class SightingCreate(SightingBase):
    timestamp: Optional[datetime] = None

class SightingResponse(BaseModel):
    id: int
    plate: str
    camera_id: int
    camera_name: Optional[str] = None
    place_name: Optional[str] = None
    zone_type: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    timestamp: datetime
    confidence: float
    vehicle_type: Optional[str] = "SEDAN"
    vehicle_color: Optional[str] = "WHITE"
    make: Optional[str] = "GENERIC"

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

# Vehicle Registry schema
class VehicleRegistrySchema(BaseModel):
    plate: str
    registered_type: str
    registered_color: str
    make: str
    model: Optional[str] = None
    owner_name: Optional[str] = None
    is_geofence_authorized: bool = False

    class Config:
        from_attributes = True

# Geofence Zone schema
class GeofenceZoneSchema(BaseModel):
    id: int
    name: str
    zone_type: str
    description: Optional[str] = None
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    color: Optional[str] = "#ef4444"

    class Config:
        from_attributes = True

# Timeline Event for Place Inventory
class TimelineEvent(BaseModel):
    event_id: int
    event_sequence: int
    sighting_id: int
    plate: str
    timestamp: datetime
    camera_id: int
    camera_name: str
    vehicle_type: str
    vehicle_color: str
    make: str
    confidence: float
    speed_kmh: Optional[float] = None
    alert_type: Optional[str] = None
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None

# Place Inventory Response
class PlaceInventoryResponse(BaseModel):
    place_name: str
    zone_type: str
    camera_count: int
    total_sightings_today: int
    anomaly_count: int
    cameras: List[CameraResponse]
    events_timeline: List[TimelineEvent]

# Trajectory schemas
class TrajectoryPoint(BaseModel):
    sighting_id: int
    camera_id: int
    camera_name: str
    place_name: Optional[str] = None
    lat: float
    lon: float
    timestamp: datetime
    confidence: float
    vehicle_type: Optional[str] = "SEDAN"
    vehicle_color: Optional[str] = "WHITE"
    make: Optional[str] = "GENERIC"
    speed_from_prev_kmh: Optional[float] = None
    distance_from_prev_km: Optional[float] = None
    time_delta_seconds: Optional[float] = None
    is_anomaly: Optional[bool] = False
    anomaly_type: Optional[str] = None
    anomaly_reason: Optional[str] = None

class TrajectoryResponse(BaseModel):
    plate: str
    is_blacklisted: bool = False
    blacklist_reason: Optional[str] = None
    registered_profile: Optional[VehicleRegistrySchema] = None
    total_sightings: int
    sightings: List[TrajectoryPoint]
    route_coordinates: List[List[float]] = []  # Snapped real road network coordinates [[lat, lon], ...]
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
    alert_type: str  # "BLACKLIST_HIT" | "SPEED_ANOMALY" | "ROUTE_SKIP" | "DUPLICATE_PLATE" | "APPEARANCE_MISMATCH" | "GEOFENCE_VIOLATION" | "ILLEGAL_UTURN" | "ILLEGAL_PARKING"
    plate: str
    camera_id: int
    camera_name: Optional[str] = None
    place_name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    timestamp: str
    reason: str
    confidence: Optional[float] = 1.0
    speed_kmh: Optional[float] = None
    vehicle_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    expected_profile: Optional[str] = None
