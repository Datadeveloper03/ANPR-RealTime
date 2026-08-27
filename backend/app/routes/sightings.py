import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import Sighting, Camera, Blacklist, VehicleRegistry
from app.schemas import SightingCreate, SightingResponse, AlertPayload, TimelineEvent
from app.pubsub import broadcaster
from app.spatial import (
    haversine_distance_km, calculate_speed_kmh,
    detect_duplicate_plate_anomaly, detect_appearance_mismatch_anomaly,
    detect_geofence_violation_anomaly, detect_uturn_anomaly,
    detect_parking_anomaly
)
from app.config import settings

router = APIRouter(tags=["Sightings"])

@router.get("/sightings/export/csv")
def export_evaluated_sightings_csv(place_name: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Exports all evaluated CCTV sightings to a structured CSV audit file
    containing ID, Place, Camera, License Plate, Vehicle Profile,
    Anomaly Status, Anomaly Type, and Detailed Anomaly Reason.
    """
    query = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .order_by(Sighting.timestamp.asc())
    )

    if place_name and place_name.upper() != "ALL":
        query = query.filter(Camera.place_name == place_name)

    records = query.all()

    # Pre-fetch blacklist and vehicle registry maps
    blacklist_map = {b.plate: b.reason for b in db.query(Blacklist).all()}
    registry_map = {r.plate: r for r in db.query(VehicleRegistry).all()}

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV Header Row
    writer.writerow([
        "Sighting_ID",
        "Place_Sector",
        "Zone_Type",
        "Camera_ID",
        "Camera_Name",
        "Camera_Direction",
        "License_Plate",
        "Detected_Vehicle_Type",
        "Detected_Vehicle_Color",
        "Make",
        "Registered_Profile",
        "Timestamp_UTC",
        "Detection_Confidence",
        "Is_Anomaly",
        "Anomaly_Type",
        "Anomaly_Reason"
    ])

    # Keep track of previous sightings per plate for sequential anomaly detection
    prev_by_plate = {}

    for s, c in records:
        is_anomaly = False
        anomaly_types = []
        anomaly_reasons = []

        reg = registry_map.get(s.plate)
        reg_dict = {
            "registered_type": reg.registered_type,
            "registered_color": reg.registered_color,
            "make": reg.make,
            "is_geofence_authorized": reg.is_geofence_authorized
        } if reg else None
        reg_profile_str = f"{reg.registered_color} {reg.registered_type} ({reg.make})" if reg else "UNREGISTERED"

        # 1. Blacklist check
        if s.plate in blacklist_map:
            is_anomaly = True
            anomaly_types.append("BLACKLIST_HIT")
            anomaly_reasons.append(f"Wanted: {blacklist_map[s.plate]}")

        # 2. Appearance mismatch check
        mismatch = detect_appearance_mismatch_anomaly(s.vehicle_type, s.vehicle_color, reg_dict)
        if mismatch:
            is_anomaly = True
            anomaly_types.append("APPEARANCE_MISMATCH")
            anomaly_reasons.append(mismatch)

        # 3. Geofence violation check
        geofence_breach = detect_geofence_violation_anomaly({"zone_type": c.zone_type, "name": c.name}, reg_dict)
        if geofence_breach:
            is_anomaly = True
            anomaly_types.append("GEOFENCE_VIOLATION")
            anomaly_reasons.append(geofence_breach)

        # 4. Previous sighting anomaly checks (Duplicate, U-Turn, Parking, Speed)
        curr_dict = {
            "camera_id": c.id, "camera_name": c.name, "place_name": c.place_name,
            "direction": c.direction, "zone_type": c.zone_type,
            "lat": c.lat, "lon": c.lon, "timestamp": s.timestamp
        }

        prev = prev_by_plate.get(s.plate)
        if prev:
            dup = detect_duplicate_plate_anomaly(prev, curr_dict)
            if dup:
                is_anomaly = True
                anomaly_types.append("DUPLICATE_PLATE")
                anomaly_reasons.append(dup)

            uturn = detect_uturn_anomaly(prev, curr_dict)
            if uturn:
                is_anomaly = True
                anomaly_types.append("ILLEGAL_UTURN")
                anomaly_reasons.append(uturn)

            park = detect_parking_anomaly(prev, curr_dict, {"zone_type": c.zone_type, "max_dwell_minutes": c.max_dwell_minutes, "name": c.name})
            if park:
                is_anomaly = True
                anomaly_types.append("ILLEGAL_PARKING")
                anomaly_reasons.append(park)

            # Speed check
            if prev["camera_id"] != c.id:
                dist_km = haversine_distance_km(prev["lat"], prev["lon"], c.lat, c.lon)
                t_curr = s.timestamp if isinstance(s.timestamp, datetime) else datetime.fromisoformat(str(s.timestamp))
                t_prev = prev["timestamp"] if isinstance(prev["timestamp"], datetime) else datetime.fromisoformat(str(prev["timestamp"]))
                if t_curr.tzinfo is not None:
                    t_curr = t_curr.astimezone(timezone.utc).replace(tzinfo=None)
                if t_prev.tzinfo is not None:
                    t_prev = t_prev.astimezone(timezone.utc).replace(tzinfo=None)
                time_delta = max((t_curr - t_prev).total_seconds(), 0.1)
                speed = calculate_speed_kmh(dist_km, time_delta)
                if dist_km > 0.05 and speed > settings.MAX_PLAUSIBLE_SPEED_KMH:
                    is_anomaly = True
                    anomaly_types.append("SPEED_ANOMALY")
                    anomaly_reasons.append(f"Speed Violation: {round(speed, 1)} km/h detected")

        # Update previous sighting record
        prev_by_plate[s.plate] = curr_dict

        # Clean reasons of any unexpected emoji characters
        clean_reasons = []
        for r in anomaly_reasons:
            clean_r = r.replace("⚠️", "").replace("🚨", "").replace("🚫", "").replace("🔄", "").replace("🅿️", "").replace("⚡", "").strip()
            clean_reasons.append(clean_r)

        writer.writerow([
            s.id,
            c.place_name or "Bangalore Central",
            c.zone_type or "STANDARD",
            c.id,
            c.name,
            c.direction or "NORTH",
            s.plate,
            s.vehicle_type or "SEDAN",
            s.vehicle_color or "WHITE",
            s.make or "GENERIC",
            reg_profile_str,
            s.timestamp.isoformat() if isinstance(s.timestamp, datetime) else str(s.timestamp),
            f"{(s.confidence * 100):.1f}%",
            "YES" if is_anomaly else "NO",
            "; ".join(anomaly_types) if anomaly_types else "CLEAN",
            "; ".join(clean_reasons) if clean_reasons else "Verified Clean Transit"
        ])

    # Prepend UTF-8 BOM (\ufeff) so Microsoft Excel, LibreOffice, and Windows tools open with clean UTF-8 encoding
    csv_data = "\ufeff" + output.getvalue()
    filename = f"anpr_cctv_evaluated_sightings_{place_name or 'all_sectors'}.csv"
    
    return Response(
        content=csv_data.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/sightings/recent", response_model=List[SightingResponse])
def get_recent_sightings(limit: int = 50, db: Session = Depends(get_db)):
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
                place_name=c.place_name,
                zone_type=c.zone_type,
                lat=c.lat,
                lon=c.lon,
                timestamp=s.timestamp,
                confidence=s.confidence,
                vehicle_type=s.vehicle_type or "SEDAN",
                vehicle_color=s.vehicle_color or "WHITE",
                make=s.make or "GENERIC"
            )
        )
    return sightings

@router.get("/sightings/timeline/{place_name}", response_model=List[TimelineEvent])
def get_place_timeline(place_name: str, limit: int = 30, db: Session = Depends(get_db)):
    """
    Returns sequential chronological timeline of events that occurred at a specific place.
    """
    cameras_in_place = db.query(Camera.id).filter(Camera.place_name == place_name).all()
    cam_ids = [c[0] for c in cameras_in_place]
    
    if not cam_ids:
        return []

    sightings = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .filter(Sighting.camera_id.in_(cam_ids))
        .order_by(Sighting.timestamp.desc())
        .limit(limit)
        .all()
    )

    events = []
    for idx, (s, c) in enumerate(reversed(sightings)):
        # Check blacklist
        bl = db.query(Blacklist).filter(Blacklist.plate == s.plate).first()
        is_bl = bl is not None
        
        events.append(
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
                anomaly_reason=bl.reason if bl else None
            )
        )
    return list(reversed(events))

@router.post("/sightings", response_model=SightingResponse, status_code=status.HTTP_201_CREATED)
async def record_sighting(sighting_in: SightingCreate, db: Session = Depends(get_db)):
    plate_clean = sighting_in.plate.strip().upper().replace(" ", "").replace("-", "")
    
    camera = db.query(Camera).filter(Camera.id == sighting_in.camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera #{sighting_in.camera_id} not found")

    timestamp = sighting_in.timestamp or datetime.now(timezone.utc)
    
    # 1. Fetch previous sighting for spatial & anomaly evaluations
    prev_sighting = (
        db.query(Sighting, Camera)
        .join(Camera, Sighting.camera_id == Camera.id)
        .filter(Sighting.plate == plate_clean)
        .order_by(Sighting.timestamp.desc())
        .first()
    )

    # 2. Fetch vehicle registry profile for appearance & geofence validation
    reg_entry = db.query(VehicleRegistry).filter(VehicleRegistry.plate == plate_clean).first()
    reg_dict = {
        "registered_type": reg_entry.registered_type,
        "registered_color": reg_entry.registered_color,
        "make": reg_entry.make,
        "is_geofence_authorized": reg_entry.is_geofence_authorized
    } if reg_entry else None

    # 3. Insert new sighting
    new_sighting = Sighting(
        plate=plate_clean,
        camera_id=sighting_in.camera_id,
        timestamp=timestamp,
        confidence=sighting_in.confidence if sighting_in.confidence is not None else 1.0,
        vehicle_type=sighting_in.vehicle_type or (reg_entry.registered_type if reg_entry else "SEDAN"),
        vehicle_color=sighting_in.vehicle_color or (reg_entry.registered_color if reg_entry else "WHITE"),
        make=sighting_in.make or (reg_entry.make if reg_entry else "GENERIC")
    )
    db.add(new_sighting)
    db.commit()
    db.refresh(new_sighting)

    # 4. Check for Blacklist Match
    blacklist_match = db.query(Blacklist).filter(Blacklist.plate == plate_clean).first()
    if blacklist_match:
        alert = {
            "alert_type": "BLACKLIST_HIT",
            "plate": plate_clean,
            "camera_id": camera.id,
            "camera_name": camera.name,
            "place_name": camera.place_name,
            "lat": camera.lat,
            "lon": camera.lon,
            "timestamp": timestamp.isoformat(),
            "reason": f"BLACKLIST MATCH: {blacklist_match.reason}",
            "confidence": new_sighting.confidence,
            "vehicle_type": new_sighting.vehicle_type,
            "vehicle_color": new_sighting.vehicle_color
        }
        await broadcaster.publish_alert(alert)

    # 5. Check Appearance Mismatch Anomaly
    mismatch_reason = detect_appearance_mismatch_anomaly(
        new_sighting.vehicle_type,
        new_sighting.vehicle_color,
        reg_dict
    )
    if mismatch_reason:
        await broadcaster.publish_alert({
            "alert_type": "APPEARANCE_MISMATCH",
            "plate": plate_clean,
            "camera_id": camera.id,
            "camera_name": camera.name,
            "place_name": camera.place_name,
            "lat": camera.lat,
            "lon": camera.lon,
            "timestamp": timestamp.isoformat(),
            "reason": mismatch_reason,
            "confidence": new_sighting.confidence,
            "vehicle_type": new_sighting.vehicle_type,
            "vehicle_color": new_sighting.vehicle_color,
            "expected_profile": f"{reg_entry.registered_color} {reg_entry.registered_type}" if reg_entry else None
        })

    # 6. Check Geofence Zone Violation
    geofence_reason = detect_geofence_violation_anomaly(
        {"zone_type": camera.zone_type, "name": camera.name},
        reg_dict
    )
    if geofence_reason:
        await broadcaster.publish_alert({
            "alert_type": "GEOFENCE_VIOLATION",
            "plate": plate_clean,
            "camera_id": camera.id,
            "camera_name": camera.name,
            "place_name": camera.place_name,
            "lat": camera.lat,
            "lon": camera.lon,
            "timestamp": timestamp.isoformat(),
            "reason": geofence_reason,
            "confidence": new_sighting.confidence
        })

    # 7. Check Previous Sighting Anomalies (Duplicate, Speed, U-Turn, Parking)
    if prev_sighting:
        prev_s, prev_c = prev_sighting
        curr_dict = {
            "camera_id": camera.id, "camera_name": camera.name, "place_name": camera.place_name,
            "direction": camera.direction, "zone_type": camera.zone_type,
            "lat": camera.lat, "lon": camera.lon, "timestamp": timestamp
        }
        prev_dict = {
            "camera_id": prev_c.id, "camera_name": prev_c.name, "place_name": prev_c.place_name,
            "direction": prev_c.direction, "zone_type": prev_c.zone_type,
            "lat": prev_c.lat, "lon": prev_c.lon, "timestamp": prev_s.timestamp
        }

        # Duplicate / Clone Plate Check
        dup_alert = detect_duplicate_plate_anomaly(prev_dict, curr_dict)
        if dup_alert:
            await broadcaster.publish_alert({
                "alert_type": "DUPLICATE_PLATE",
                "plate": plate_clean,
                "camera_id": camera.id,
                "camera_name": camera.name,
                "place_name": camera.place_name,
                "lat": camera.lat,
                "lon": camera.lon,
                "timestamp": timestamp.isoformat(),
                "reason": dup_alert,
                "confidence": new_sighting.confidence
            })

        # Illegal U-Turn Check
        uturn_alert = detect_uturn_anomaly(prev_dict, curr_dict)
        if uturn_alert:
            await broadcaster.publish_alert({
                "alert_type": "ILLEGAL_UTURN",
                "plate": plate_clean,
                "camera_id": camera.id,
                "camera_name": camera.name,
                "place_name": camera.place_name,
                "lat": camera.lat,
                "lon": camera.lon,
                "timestamp": timestamp.isoformat(),
                "reason": uturn_alert,
                "confidence": new_sighting.confidence
            })

        # Illegal Parking Check
        parking_alert = detect_parking_anomaly(prev_dict, curr_dict, {"zone_type": camera.zone_type, "max_dwell_minutes": camera.max_dwell_minutes, "name": camera.name})
        if parking_alert:
            await broadcaster.publish_alert({
                "alert_type": "ILLEGAL_PARKING",
                "plate": plate_clean,
                "camera_id": camera.id,
                "camera_name": camera.name,
                "place_name": camera.place_name,
                "lat": camera.lat,
                "lon": camera.lon,
                "timestamp": timestamp.isoformat(),
                "reason": parking_alert,
                "confidence": new_sighting.confidence
            })

        # Speed Anomaly Check
        if prev_c.id != camera.id:
            dist_km = haversine_distance_km(prev_c.lat, prev_c.lon, camera.lat, camera.lon)
            t_curr = timestamp if isinstance(timestamp, datetime) else datetime.fromisoformat(str(timestamp))
            t_prev = prev_s.timestamp if isinstance(prev_s.timestamp, datetime) else datetime.fromisoformat(str(prev_s.timestamp))
            if t_curr.tzinfo is not None:
                t_curr = t_curr.astimezone(timezone.utc).replace(tzinfo=None)
            if t_prev.tzinfo is not None:
                t_prev = t_prev.astimezone(timezone.utc).replace(tzinfo=None)
                
            time_delta = max((t_curr - t_prev).total_seconds(), 0.1)
            speed = calculate_speed_kmh(dist_km, time_delta)

            if dist_km > 0.05 and speed > settings.MAX_PLAUSIBLE_SPEED_KMH:
                await broadcaster.publish_alert({
                    "alert_type": "SPEED_ANOMALY",
                    "plate": plate_clean,
                    "camera_id": camera.id,
                    "camera_name": camera.name,
                    "place_name": camera.place_name,
                    "lat": camera.lat,
                    "lon": camera.lon,
                    "timestamp": timestamp.isoformat(),
                    "speed_kmh": round(speed, 1),
                    "reason": f"⚡ SPEED ANOMALY: {round(speed, 1)} km/h detected between {prev_c.name} and {camera.name} ({round(dist_km, 2)}km in {int(time_delta)}s)",
                    "confidence": new_sighting.confidence
                })

    return SightingResponse(
        id=new_sighting.id,
        plate=new_sighting.plate,
        camera_id=camera.id,
        camera_name=camera.name,
        place_name=camera.place_name,
        zone_type=camera.zone_type,
        lat=camera.lat,
        lon=camera.lon,
        timestamp=new_sighting.timestamp,
        confidence=new_sighting.confidence,
        vehicle_type=new_sighting.vehicle_type,
        vehicle_color=new_sighting.vehicle_color,
        make=new_sighting.make
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
