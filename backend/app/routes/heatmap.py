from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Sighting, Camera
from app.schemas import HeatmapPoint

router = APIRouter(prefix="/heatmap", tags=["Heatmap"])

@router.get("", response_model=List[HeatmapPoint])
def get_heatmap_data(db: Session = Depends(get_db)):
    """
    Returns aggregated sighting counts grouped by camera, 
    normalized for leaflet.heat ([lat, lon, intensity]).
    """
    results = (
        db.query(
            Camera.id,
            Camera.name,
            Camera.lat,
            Camera.lon,
            func.count(Sighting.id).label("count")
        )
        .outerjoin(Sighting, Camera.id == Sighting.camera_id)
        .group_by(Camera.id, Camera.name, Camera.lat, Camera.lon)
        .all()
    )

    max_count = max([r.count for r in results], default=1) or 1

    heatmap_points = []
    for r in results:
        # Intensity between 0.2 and 1.0 based on count proportion
        intensity = 0.2 + (0.8 * (r.count / max_count)) if r.count > 0 else 0.0
        heatmap_points.append(
            HeatmapPoint(
                camera_id=r.id,
                camera_name=r.name,
                lat=r.lat,
                lon=r.lon,
                count=r.count,
                intensity=round(intensity, 2)
            )
        )

    return heatmap_points
