from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Camera, Sighting, Blacklist, VehicleRegistry, GeofenceZone
from app.database import engine, Base, SessionLocal

SAMPLE_CAMERAS = [
    {
        "id": 1, "name": "Cam 01 - MG Road Junction", "lat": 12.9756, "lon": 77.6067,
        "place_name": "MG Road", "zone_type": "INTERSECTION", "direction": "NORTH", "max_dwell_minutes": 3.0
    },
    {
        "id": 2, "name": "Cam 02 - Indiranagar 100ft Rd", "lat": 12.9784, "lon": 77.6408,
        "place_name": "Indiranagar", "zone_type": "NO_PARKING", "direction": "EAST", "max_dwell_minutes": 2.0
    },
    {
        "id": 3, "name": "Cam 03 - Domlur Flyover", "lat": 12.9609, "lon": 77.6387,
        "place_name": "Domlur", "zone_type": "STANDARD", "direction": "SOUTH", "max_dwell_minutes": 5.0
    },
    {
        "id": 4, "name": "Cam 04 - Koramangala Sony Signal", "lat": 12.9352, "lon": 77.6245,
        "place_name": "Koramangala", "zone_type": "RESTRICTED_GEOFENCE", "direction": "SOUTH", "max_dwell_minutes": 4.0
    },
    {
        "id": 5, "name": "Cam 05 - Silk Board Outer Ring", "lat": 12.9176, "lon": 77.6233,
        "place_name": "Silk Board", "zone_type": "STANDARD", "direction": "SOUTH", "max_dwell_minutes": 5.0
    },
    {
        "id": 6, "name": "Cam 06 - Electronic City Toll Plaza", "lat": 12.8452, "lon": 77.6602,
        "place_name": "Electronic City", "zone_type": "STANDARD", "direction": "SOUTH", "max_dwell_minutes": 5.0
    },
    {
        "id": 7, "name": "Cam 07 - MG Road South Corridor", "lat": 12.9740, "lon": 77.6075,
        "place_name": "MG Road", "zone_type": "INTERSECTION", "direction": "SOUTH", "max_dwell_minutes": 3.0
    },
    {
        "id": 8, "name": "Cam 08 - Koramangala Ring Road Hub", "lat": 12.9330, "lon": 77.6260,
        "place_name": "Koramangala", "zone_type": "RESTRICTED_GEOFENCE", "direction": "EAST", "max_dwell_minutes": 4.0
    }
]

SAMPLE_BLACKLIST = [
    {"plate": "MH12DE1433", "reason": "STOLEN VEHICLE - Red Notice / Alert ID #9921"},
    {"plate": "DL04CA9090", "reason": "SUSPECT VEHICLE - Wanted in Robbery Case #2024-88"},
    {"plate": "HR26DK7777", "reason": "UNPAID TOLL EVASION - Multiple Violations"}
]

SAMPLE_VEHICLE_REGISTRY = [
    {"plate": "DL01AB1234", "registered_type": "SEDAN", "registered_color": "WHITE", "make": "HONDA", "model": "City", "owner_name": "R. Sharma", "is_geofence_authorized": True},
    {"plate": "MH12DE1433", "registered_type": "SUV", "registered_color": "BLACK", "make": "MAHINDRA", "model": "Scorpio", "owner_name": "Unknown", "is_geofence_authorized": False},
    {"plate": "KA05MB4567", "registered_type": "SEDAN", "registered_color": "SILVER", "make": "HYUNDAI", "model": "Verna", "owner_name": "A. Kumar", "is_geofence_authorized": False},
    {"plate": "TN09BZ9999", "registered_type": "SEDAN", "registered_color": "RED", "make": "MARUTI", "model": "Dzire", "owner_name": "V. Raman", "is_geofence_authorized": False},
    {"plate": "KA01MJ1122", "registered_type": "HATCHBACK", "registered_color": "BLUE", "make": "TATA", "model": "Altroz", "owner_name": "P. Nair", "is_geofence_authorized": False},
    {"plate": "KA04EK9081", "registered_type": "TRUCK", "registered_color": "YELLOW", "make": "TATA", "model": "Ace", "owner_name": "Express Logistics", "is_geofence_authorized": False},
    {"plate": "TS07AB4040", "registered_type": "SUV", "registered_color": "WHITE", "make": "TOYOTA", "model": "Fortuner", "owner_name": "S. Reddy", "is_geofence_authorized": True},
    {"plate": "DL08CD5566", "registered_type": "SEDAN", "registered_color": "GREY", "make": "SKODA", "model": "Slavia", "owner_name": "M. Verma", "is_geofence_authorized": False},
]

def seed_database(db: Session = None):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    close_after = False
    if db is None:
        db = SessionLocal()
        close_after = True

    try:
        # Reset and refresh camera seed
        db.query(Camera).delete()
        for cam in SAMPLE_CAMERAS:
            db.add(Camera(
                id=cam["id"],
                name=cam["name"],
                lat=cam["lat"],
                lon=cam["lon"],
                place_name=cam["place_name"],
                zone_type=cam["zone_type"],
                direction=cam["direction"],
                max_dwell_minutes=cam["max_dwell_minutes"]
            ))
        db.commit()

        # Seed Vehicle Registry
        db.query(VehicleRegistry).delete()
        for reg in SAMPLE_VEHICLE_REGISTRY:
            db.add(VehicleRegistry(
                plate=reg["plate"],
                registered_type=reg["registered_type"],
                registered_color=reg["registered_color"],
                make=reg["make"],
                model=reg.get("model"),
                owner_name=reg.get("owner_name"),
                is_geofence_authorized=reg.get("is_geofence_authorized", False)
            ))
        db.commit()

        # Seed Blacklist
        db.query(Blacklist).delete()
        for b in SAMPLE_BLACKLIST:
            db.add(Blacklist(plate=b["plate"], reason=b["reason"]))
        db.commit()

        # Seed Sightings for all 8 rich anomaly scenarios
        db.query(Sighting).delete()
        now = datetime.now(timezone.utc)

        # 1. Clean Trajectory: DL01AB1234
        for cam_id, mins, conf in [(1, 45, 0.96), (2, 36, 0.94), (3, 27, 0.98), (4, 18, 0.95)]:
            db.add(Sighting(plate="DL01AB1234", camera_id=cam_id, timestamp=now - timedelta(minutes=mins), confidence=conf, vehicle_type="SEDAN", vehicle_color="WHITE", make="HONDA"))

        # 2. Blacklisted: MH12DE1433
        for cam_id, mins, conf in [(1, 30, 0.97), (3, 20, 0.92), (5, 8, 0.99)]:
            db.add(Sighting(plate="MH12DE1433", camera_id=cam_id, timestamp=now - timedelta(minutes=mins), confidence=conf, vehicle_type="SUV", vehicle_color="BLACK", make="MAHINDRA"))

        # 3. Speed Anomaly: KA05MB4567 (Domlur -> Electronic City in 2 mins)
        for cam_id, mins, conf in [(3, 12, 0.95), (6, 10, 0.93)]:
            db.add(Sighting(plate="KA05MB4567", camera_id=cam_id, timestamp=now - timedelta(minutes=mins), confidence=conf, vehicle_type="SEDAN", vehicle_color="SILVER", make="HYUNDAI"))

        # 4. Vehicle Appearance Mismatch: TN09BZ9999 (Registered Red Sedan, but detected as White Truck/Van)
        for cam_id, mins, conf in [(1, 50, 0.93), (2, 40, 0.91), (4, 25, 0.95)]:
            db.add(Sighting(plate="TN09BZ9999", camera_id=cam_id, timestamp=now - timedelta(minutes=mins), confidence=conf, vehicle_type="TRUCK", vehicle_color="WHITE", make="TATA"))

        # 5. Duplicate / Ghost Plate: KA01MJ1122 (Teleportation across Koramangala & Electronic City in 10s)
        db.add(Sighting(plate="KA01MJ1122", camera_id=4, timestamp=now - timedelta(minutes=14), confidence=0.98, vehicle_type="HATCHBACK", vehicle_color="BLUE", make="TATA"))
        db.add(Sighting(plate="KA01MJ1122", camera_id=6, timestamp=now - timedelta(minutes=14) + timedelta(seconds=12), confidence=0.97, vehicle_type="HATCHBACK", vehicle_color="BLUE", make="TATA"))

        # 6. Geofence Zone Violation: KA04EK9081 (Unauthorized Truck inside Koramangala Restricted Geofence)
        for cam_id, mins in [(5, 25), (4, 15), (8, 6)]:
            db.add(Sighting(plate="KA04EK9081", camera_id=cam_id, timestamp=now - timedelta(minutes=mins), confidence=0.96, vehicle_type="TRUCK", vehicle_color="YELLOW", make="TATA"))

        # 7. Illegal U-Turn: TS07AB4040 (Rapid reverse transit across MG Road North & South corridors)
        t_uturn = now - timedelta(minutes=22)
        db.add(Sighting(plate="TS07AB4040", camera_id=1, timestamp=t_uturn, confidence=0.97, vehicle_type="SUV", vehicle_color="WHITE", make="TOYOTA"))
        db.add(Sighting(plate="TS07AB4040", camera_id=7, timestamp=t_uturn + timedelta(seconds=28), confidence=0.96, vehicle_type="SUV", vehicle_color="WHITE", make="TOYOTA"))

        # 8. Illegal Parking / Loitering: DL08CD5566 (Stationary in Indiranagar No-Parking zone for 9 mins)
        t_park = now - timedelta(minutes=35)
        db.add(Sighting(plate="DL08CD5566", camera_id=2, timestamp=t_park, confidence=0.95, vehicle_type="SEDAN", vehicle_color="GREY", make="SKODA"))
        db.add(Sighting(plate="DL08CD5566", camera_id=2, timestamp=t_park + timedelta(minutes=9), confidence=0.97, vehicle_type="SEDAN", vehicle_color="GREY", make="SKODA"))

        # Additional ambient traffic across all places for dense feeds
        ambient_plates = [
            ("KA03HA4321", 1, "HATCHBACK", "WHITE"),
            ("KA02TR5544", 2, "SEDAN", "BLACK"),
            ("HR51AK1100", 3, "SUV", "SILVER"),
            ("MH02EE9876", 4, "SEDAN", "WHITE"),
            ("KA53MN8899", 5, "HATCHBACK", "RED"),
            ("KA01BB3344", 6, "SUV", "GREY"),
            ("KA04ZZ1212", 7, "SEDAN", "BLUE"),
            ("KA05QQ8989", 8, "VAN", "WHITE")
        ]
        for i, (p, c_id, vtype, vcol) in enumerate(ambient_plates):
            db.add(Sighting(plate=p, camera_id=c_id, timestamp=now - timedelta(minutes=i*3 + 1), confidence=0.92, vehicle_type=vtype, vehicle_color=vcol, make="GENERIC"))

        db.commit()
        print("Successfully seeded all advanced ANPR cameras, vehicle registry, and anomaly trajectories.")

    finally:
        if close_after:
            db.close()

if __name__ == "__main__":
    seed_database()
