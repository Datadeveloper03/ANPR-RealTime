from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Camera, Sighting
from app.schemas import CameraResponse, CameraCreate

router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=List[CameraResponse])
def get_cameras(db: Session = Depends(get_db)):
    """Return all cameras with total sightings count for initial map render."""
    cameras = db.query(Camera).all()
    results = []
    for cam in cameras:
        sightings_count = db.query(func.count(Sighting.id)).filter(Sighting.camera_id == cam.id).scalar()
        results.append(
            CameraResponse(
                id=cam.id,
                name=cam.name,
                lat=cam.lat,
                lon=cam.lon,
                total_sightings=sightings_count or 0
            )
        )
    return results

@router.post("", response_model=CameraResponse)
def create_camera(cam_in: CameraCreate, db: Session = Depends(get_db)):
    camera = Camera(name=cam_in.name, lat=cam_in.lat, lon=cam_in.lon)
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return CameraResponse(
        id=camera.id,
        name=camera.name,
        lat=camera.lat,
        lon=camera.lon,
        total_sightings=0
    )
