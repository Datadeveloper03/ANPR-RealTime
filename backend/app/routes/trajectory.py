from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Sighting, Camera, Blacklist, VehicleRegistry
from app.schemas import TrajectoryResponse, TrajectoryPoint, VehicleRegistrySchema
from app.spatial import analyze_trajectory_anomalies
from app.config import settings

router = APIRouter(prefix="/trajectory", tags=["Trajectory"])

@router.get("/{plate}", response_model=TrajectoryResponse)
def get_plate_trajectory(plate: str, db: Session = Depends(get_db)):
    plate_clean = plate.strip().upper().replace(" ", "").replace("-", "")
    
    # Check blacklist status
    blacklist_entry = db.query(Blacklist).filter(Blacklist.plate == plate_clean).first()
    is_blacklisted = blacklist_entry is not None
    blacklist_reason = blacklist_entry.reason if blacklist_entry else None

    # Fetch vehicle registry profile
    reg_entry = db.query(VehicleRegistry).filter(VehicleRegistry.plate == plate_clean).first()
    reg_schema = VehicleRegistrySchema.model_validate(reg_entry) if reg_entry else None
    reg_dict = {
        "registered_type": reg_entry.registered_type,
        "registered_color": reg_entry.registered_color,
        "make": reg_entry.make,
        "is_geofence_authorized": reg_entry.is_geofence_authorized
    } if reg_entry else None

    # Fetch sightings joined with camera
    raw_sightings = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .filter(Sighting.plate == plate_clean)
        .order_by(Sighting.timestamp.asc())
        .all()
    )

    if not raw_sightings:
        raw_sightings = (
            db.query(Sighting, Camera)
            .join(Camera, Sighting.camera_id == Camera.id)
            .filter(Sighting.plate == plate)
            .order_by(Sighting.timestamp.asc())
            .all()
        )

    sightings_data = []
    for s, c in raw_sightings:
        sightings_data.append({
            "sighting_id": s.id,
            "camera_id": c.id,
            "camera_name": c.name,
            "place_name": c.place_name,
            "zone_type": c.zone_type,
            "direction": c.direction,
            "lat": c.lat,
            "lon": c.lon,
            "timestamp": s.timestamp,
            "confidence": s.confidence,
            "vehicle_type": s.vehicle_type or (reg_entry.registered_type if reg_entry else "SEDAN"),
            "vehicle_color": s.vehicle_color or (reg_entry.registered_color if reg_entry else "WHITE"),
            "make": s.make or (reg_entry.make if reg_entry else "GENERIC")
        })

    # Analyze speed, road routing, and all 6 anomaly rules
    processed_sightings, detected_anomalies, route_coords = analyze_trajectory_anomalies(
        sightings_data,
        registered_profile=reg_dict,
        max_speed_kmh=settings.MAX_PLAUSIBLE_SPEED_KMH,
        min_speed_kmh=settings.MIN_PLAUSIBLE_SPEED_KMH
    )

    points = [TrajectoryPoint(**p) for p in processed_sightings]

    return TrajectoryResponse(
        plate=plate_clean,
        is_blacklisted=is_blacklisted,
        blacklist_reason=blacklist_reason,
        registered_profile=reg_schema,
        total_sightings=len(points),
        sightings=points,
        route_coordinates=route_coords,
        has_anomalies=len(detected_anomalies) > 0,
        anomalies=detected_anomalies
    )
