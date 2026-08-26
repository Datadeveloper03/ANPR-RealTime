from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.database import get_db
from app.models import Sighting, Camera, Blacklist
from app.schemas import SightingCreate, SightingResponse, AlertPayload
from app.pubsub import broadcaster
from app.spatial import haversine_distance_km, calculate_speed_kmh
from app.config import settings

router = APIRouter(tags=["Sightings"])

@router.get("/sightings/recent", response_model=List[SightingResponse])
def get_recent_sightings(limit: int = 25, db: Session = Depends(get_db)):
    results = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .order_by(Sighting.timestamp.desc())
        .limit(limit)
        .all()
    )
    
    sightings = []
    for s, c in results:
        sightings.append(
            SightingResponse(
                id=s.id,
                plate=s.plate,
                camera_id=c.id,
                camera_name=c.name,
                lat=c.lat,
                lon=c.lon,
                timestamp=s.timestamp,
                confidence=s.confidence
            )
        )
    return sightings

@router.post("/sightings", response_model=SightingResponse, status_code=status.HTTP_201_CREATED)
async def record_sighting(sighting_in: SightingCreate, db: Session = Depends(get_db)):
    plate_clean = sighting_in.plate.strip().upper().replace(" ", "").replace("-", "")
    
    camera = db.query(Camera).filter(Camera.id == sighting_in.camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera #{sighting_in.camera_id} not found")

    timestamp = sighting_in.timestamp or datetime.now(timezone.utc)
    
    # 1. Fetch previous sighting for speed/anomaly calculation
    prev_sighting = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .filter(Sighting.plate == plate_clean)
        .order_by(Sighting.timestamp.desc())
        .first()
    )

    # 2. Insert new sighting
    new_sighting = Sighting(
        plate=plate_clean,
        camera_id=sighting_in.camera_id,
        timestamp=timestamp,
        confidence=sighting_in.confidence if sighting_in.confidence is not None else 1.0
    )
    db.add(new_sighting)
    db.commit()
    db.refresh(new_sighting)

    # 3. Check for Blacklist Match
    blacklist_match = db.query(Blacklist).filter(Blacklist.plate == plate_clean).first()
    if blacklist_match:
        alert = {
            "alert_type": "BLACKLIST_HIT",
            "plate": plate_clean,
            "camera_id": camera.id,
            "camera_name": camera.name,
            "lat": camera.lat,
            "lon": camera.lon,
            "timestamp": timestamp.isoformat(),
            "reason": f"⚠️ BLACKLIST MATCH: {blacklist_match.reason}",
            "confidence": new_sighting.confidence
        }
        await broadcaster.publish_alert(alert)

    # 4. Check for Speed / Route Anomaly
    if prev_sighting:
        prev_s, prev_c = prev_sighting
        if prev_c.id != camera.id:
            dist_km = haversine_distance_km(prev_c.lat, prev_c.lon, camera.lat, camera.lon)
            
            t_curr = timestamp if isinstance(timestamp, datetime) else datetime.fromisoformat(str(timestamp))
            t_prev = prev_s.timestamp if isinstance(prev_s.timestamp, datetime) else datetime.fromisoformat(str(prev_s.timestamp))
            
            # Ensure both are offset-naive for comparison
            if t_curr.tzinfo is not None:
                t_curr = t_curr.astimezone(timezone.utc).replace(tzinfo=None)
            if t_prev.tzinfo is not None:
                t_prev = t_prev.astimezone(timezone.utc).replace(tzinfo=None)
                
            time_delta = max((t_curr - t_prev).total_seconds(), 0.1)
            speed = calculate_speed_kmh(dist_km, time_delta)

            if dist_km > 0.05 and speed > settings.MAX_PLAUSIBLE_SPEED_KMH:
                speed_alert = {
                    "alert_type": "SPEED_ANOMALY",
                    "plate": plate_clean,
                    "camera_id": camera.id,
                    "camera_name": camera.name,
                    "lat": camera.lat,
                    "lon": camera.lon,
                    "timestamp": timestamp.isoformat(),
                    "speed_kmh": round(speed, 1),
                    "reason": f"🚨 SPEED ANOMALY: {round(speed, 1)} km/h detected between {prev_c.name} and {camera.name} ({round(dist_km, 2)}km in {int(time_delta)}s)",
                    "confidence": new_sighting.confidence
                }
                await broadcaster.publish_alert(speed_alert)

    return SightingResponse(
        id=new_sighting.id,
        plate=new_sighting.plate,
        camera_id=camera.id,
        camera_name=camera.name,
        lat=camera.lat,
        lon=camera.lon,
        timestamp=new_sighting.timestamp,
        confidence=new_sighting.confidence
    )

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    total_sightings = db.query(func.count(Sighting.id)).scalar() or 0
    unique_plates = db.query(func.count(func.distinct(Sighting.plate))).scalar() or 0
    total_cameras = db.query(func.count(Camera.id)).scalar() or 0
    blacklist_count = db.query(func.count(Blacklist.plate)).scalar() or 0

    return {
        "total_sightings": total_sightings,
        "unique_vehicles": unique_plates,
        "active_cameras": total_cameras,
        "blacklisted_vehicles": blacklist_count
    }
