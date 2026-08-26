from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Sighting, Camera, Blacklist
from app.schemas import TrajectoryResponse, TrajectoryPoint
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

    # Fetch sightings joined with camera
    raw_sightings = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .filter(Sighting.plate == plate_clean)
        .order_by(Sighting.timestamp.asc())
        .all()
    )

    if not raw_sightings:
        # Also try raw search without normalization just in case
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
            "lat": c.lat,
            "lon": c.lon,
            "timestamp": s.timestamp,
            "confidence": s.confidence
        })

    # Analyze speed & route anomalies
    processed_sightings, detected_anomalies = analyze_trajectory_anomalies(
        sightings_data, 
        max_speed_kmh=settings.MAX_PLAUSIBLE_SPEED_KMH,
        min_speed_kmh=settings.MIN_PLAUSIBLE_SPEED_KMH
    )

    points = [TrajectoryPoint(**p) for p in processed_sightings]

    return TrajectoryResponse(
        plate=plate_clean,
        is_blacklisted=is_blacklisted,
        blacklist_reason=blacklist_reason,
        total_sightings=len(points),
        sightings=points,
        has_anomalies=len(detected_anomalies) > 0,
        anomalies=detected_anomalies
    )
