from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Camera, Sighting, Blacklist
from app.database import engine, Base, SessionLocal

SAMPLE_CAMERAS = [
    {"id": 1, "name": "Cam 01 - MG Road Junction", "lat": 12.9756, "lon": 77.6067},
    {"id": 2, "name": "Cam 02 - Indiranagar 100ft Rd", "lat": 12.9784, "lon": 77.6408},
    {"id": 3, "name": "Cam 03 - Domlur Flyover", "lat": 12.9609, "lon": 77.6387},
    {"id": 4, "name": "Cam 04 - Koramangala Sony Signal", "lat": 12.9352, "lon": 77.6245},
    {"id": 5, "name": "Cam 05 - Silk Board Outer Ring", "lat": 12.9176, "lon": 77.6233},
    {"id": 6, "name": "Cam 06 - Electronic City Toll Plaza", "lat": 12.8452, "lon": 77.6602}
]

SAMPLE_BLACKLIST = [
    {"plate": "MH12DE1433", "reason": "STOLEN VEHICLE - Red Notice / Alert ID #9921"},
    {"plate": "DL04CA9090", "reason": "SUSPECT VEHICLE - Wanted in Robbery Case #2024-88"},
    {"plate": "HR26DK7777", "reason": "UNPAID TOLL EVASION - Multiple Violations"}
]

def seed_database(db: Session = None):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # Check if cameras already seeded
        existing_cams = db.query(Camera).count()
        if existing_cams == 0:
            for cam in SAMPLE_CAMERAS:
                db.add(Camera(id=cam["id"], name=cam["name"], lat=cam["lat"], lon=cam["lon"]))
            db.commit()
            print("Seeded cameras successfully.")

        # Check if blacklist already seeded
        existing_blacklist = db.query(Blacklist).count()
        if existing_blacklist == 0:
            for b in SAMPLE_BLACKLIST:
                db.add(Blacklist(plate=b["plate"], reason=b["reason"]))
            db.commit()
            print("Seeded blacklist successfully.")

        # Seed baseline demo sightings if empty
        existing_sightings = db.query(Sighting).count()
        if existing_sightings == 0:
            now = datetime.now(timezone.utc)

            # 1. Clean Trajectory: DL01AB1234 (MG Road -> Indiranagar -> Domlur -> Koramangala)
            clean_plate = "DL01AB1234"
            route_clean = [
                (1, now - timedelta(minutes=45), 0.96),
                (2, now - timedelta(minutes=38), 0.94),
                (3, now - timedelta(minutes=30), 0.98),
                (4, now - timedelta(minutes=20), 0.95),
            ]
            for cam_id, t, conf in route_clean:
                db.add(Sighting(plate=clean_plate, camera_id=cam_id, timestamp=t, confidence=conf))

            # 2. Blacklisted Plate: MH12DE1433 (MG Road -> Indiranagar -> Silk Board)
            bl_plate = "MH12DE1433"
            route_bl = [
                (1, now - timedelta(minutes=25), 0.97),
                (2, now - timedelta(minutes=15), 0.92),
                (5, now - timedelta(minutes=5), 0.99),
            ]
            for cam_id, t, conf in route_bl:
                db.add(Sighting(plate=bl_plate, camera_id=cam_id, timestamp=t, confidence=conf))

            # 3. Anomalous Speed Plate: KA05MB4567 (Domlur -> Electronic City in 2 minutes = 220+ km/h!)
            speed_plate = "KA05MB4567"
            route_speed = [
                (3, now - timedelta(minutes=12), 0.95),
                (6, now - timedelta(minutes=10), 0.93),  # ~14km in 2 minutes!
            ]
            for cam_id, t, conf in route_speed:
                db.add(Sighting(plate=speed_plate, camera_id=cam_id, timestamp=t, confidence=conf))

            # 4. Route Jump / Skip Anomaly Plate: TN09BZ9999 (MG Road -> Silk Board skipping intermediate ring roads)
            skip_plate = "TN09BZ9999"
            route_skip = [
                (1, now - timedelta(minutes=60), 0.91),
                (5, now - timedelta(minutes=58), 0.89), # 7.5km jump in 2 min
            ]
            for cam_id, t, conf in route_skip:
                db.add(Sighting(plate=skip_plate, camera_id=cam_id, timestamp=t, confidence=conf))

            # 5. Density background traffic for rich heatmap
            sample_ambient_plates = [
                "KA01MJ1122", "KA03HA4321", "KA04EK9081", "KA02TR5544", 
                "DL08CD5566", "MH02EE9876", "HR51AK1100", "TS07AB4040"
            ]
            for i, p in enumerate(sample_ambient_plates):
                c_id = (i % 6) + 1
                db.add(Sighting(plate=p, camera_id=c_id, timestamp=now - timedelta(minutes=i*7 + 2), confidence=0.92))
                # Add multiple sightings for heat
                if i % 2 == 0:
                    db.add(Sighting(plate=p, camera_id=((c_id + 1) % 6) + 1, timestamp=now - timedelta(minutes=i*5 + 1), confidence=0.94))

            db.commit()
            print("Seeded demo sightings successfully.")

    finally:
        if close_after:
            db.close()

if __name__ == "__main__":
    seed_database()
