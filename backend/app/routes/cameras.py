from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from collections import defaultdict
from app.database import get_db
from app.models import Camera, Sighting, Blacklist
from app.schemas import CameraResponse, CameraCreate, PlaceInventoryResponse, TimelineEvent

router = APIRouter(prefix="/cameras", tags=["Cameras"])

CAM_VIDEO_MAP = {
    1: "cam_01_mg_road.mp4",
    2: "cam_02_indiranagar.mp4",
    3: "cam_03_domlur.mp4",
    4: "cam_04_koramangala.mp4",
    5: "cam_05_silk_board.mp4",
    6: "cam_06_electronic_city.mp4",
    7: "cam_07_mg_road_south.mp4",
    8: "cam_08_koramangala_hub.mp4",
}

@router.get("", response_model=List[CameraResponse])
def get_cameras(db: Session = Depends(get_db)):
    """Return all cameras with total sightings count, place/zone metadata, and demo video stream URLs."""
    cameras = db.query(Camera).all()
    results = []
    for cam in cameras:
        sightings_count = db.query(func.count(Sighting.id)).filter(Sighting.camera_id == cam.id).scalar()
        v_file = CAM_VIDEO_MAP.get(cam.id, f"cam_{cam.id:02d}.mp4")
        results.append(
            CameraResponse(
                id=cam.id,
                name=cam.name,
                lat=cam.lat,
                lon=cam.lon,
                place_name=cam.place_name or "Bangalore Central",
                zone_type=cam.zone_type or "STANDARD",
                direction=cam.direction or "NORTH",
                max_dwell_minutes=cam.max_dwell_minutes or 5.0,
                total_sightings=sightings_count or 0,
                video_filename=v_file,
                video_url=f"/videos/{v_file}"
            )
        )
    return results

@router.get("/places", response_model=List[PlaceInventoryResponse])
def get_place_inventories(db: Session = Depends(get_db)):
    """
    Returns place-specific inventories grouping cameras, live event timelines,
    and sighting statistics by Place Name (e.g. Koramangala, MG Road, Electronic City).
    """
    cameras = db.query(Camera).all()
    places_map = defaultdict(list)
    for cam in cameras:
        place = cam.place_name or "Bangalore Central"
        sightings_count = db.query(func.count(Sighting.id)).filter(Sighting.camera_id == cam.id).scalar() or 0
        v_file = CAM_VIDEO_MAP.get(cam.id, f"cam_{cam.id:02d}.mp4")
        cam_resp = CameraResponse(
            id=cam.id,
            name=cam.name,
            lat=cam.lat,
            lon=cam.lon,
            place_name=place,
            zone_type=cam.zone_type or "STANDARD",
            direction=cam.direction or "NORTH",
            max_dwell_minutes=cam.max_dwell_minutes or 5.0,
            total_sightings=sightings_count,
            video_filename=v_file,
            video_url=f"/videos/{v_file}"
        )
        places_map[place].append(cam_resp)

    # Blacklist cache
    blacklisted_plates = set(p[0] for p in db.query(Blacklist.plate).all())

    inventories = []
    for place_name, cams in places_map.items():
        cam_ids = [c.id for c in cams]
        
        # Query latest 15 sightings for this place
        recent_sightings = (
            db.query(Sighting, Camera)
            .join(Camera, Sighting.camera_id == Camera.id)
            .filter(Sighting.camera_id.in_(cam_ids))
            .order_by(Sighting.timestamp.desc())
            .limit(15)
            .all()
        )

        total_sightings = sum(c.total_sightings or 0 for c in cams)
        zone_type = cams[0].zone_type or "STANDARD"

        timeline_events = []
        anomaly_count = 0
        for idx, (s, c) in enumerate(reversed(recent_sightings)):
            is_bl = s.plate in blacklisted_plates
            if is_bl:
                anomaly_count += 1
            timeline_events.append(
                TimelineEvent(
                    event_id=s.id,
                    event_sequence=idx + 1,
                    sighting_id=s.id,
                    plate=s.plate,
                    timestamp=s.timestamp,
                    camera_id=c.id,
                    camera_name=c.name,
                    vehicle_type=s.vehicle_type or "SEDAN",
                    vehicle_color=s.vehicle_color or "WHITE",
                    make=s.make or "GENERIC",
                    confidence=s.confidence,
                    speed_kmh=None,
                    alert_type="BLACKLIST_HIT" if is_bl else None,
                    is_anomaly=is_bl,
                    anomaly_reason="Blacklisted Vehicle Hit" if is_bl else None
                )
            )

        inventories.append(
            PlaceInventoryResponse(
                place_name=place_name,
                zone_type=zone_type,
                camera_count=len(cams),
                total_sightings_today=total_sightings,
                anomaly_count=anomaly_count,
                cameras=cams,
                events_timeline=list(reversed(timeline_events))
            )
        )

    return inventories

@router.post("", response_model=CameraResponse)
def create_camera(cam_in: CameraCreate, db: Session = Depends(get_db)):
    camera = Camera(
        name=cam_in.name,
        lat=cam_in.lat,
        lon=cam_in.lon,
        place_name=cam_in.place_name or "Bangalore Central",
        zone_type=cam_in.zone_type or "STANDARD",
        direction=cam_in.direction or "NORTH",
        max_dwell_minutes=cam_in.max_dwell_minutes or 5.0
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return CameraResponse(
        id=camera.id,
        name=camera.name,
        lat=camera.lat,
        lon=camera.lon,
        place_name=camera.place_name,
        zone_type=camera.zone_type,
        direction=camera.direction,
        max_dwell_minutes=camera.max_dwell_minutes,
        total_sightings=0
    )
