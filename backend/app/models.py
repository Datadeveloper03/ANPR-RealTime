from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    place_name = Column(Text, nullable=False, default="Bangalore Central")
    zone_type = Column(Text, nullable=False, default="STANDARD")  # STANDARD, RESTRICTED_GEOFENCE, NO_PARKING, INTERSECTION
    direction = Column(Text, nullable=True, default="NORTH")      # NORTH, SOUTH, EAST, WEST, BIDIRECTIONAL
    max_dwell_minutes = Column(Float, nullable=True, default=5.0)

    sightings = relationship("Sighting", back_populates="camera", cascade="all, delete-orphan")

class Sighting(Base):
    __tablename__ = "sightings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate = Column(Text, nullable=False, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    confidence = Column(Float, default=1.0)
    vehicle_type = Column(Text, nullable=True, default="SEDAN")    # SEDAN, SUV, TRUCK, HATCHBACK, BIKE, BUS, VAN
    vehicle_color = Column(Text, nullable=True, default="WHITE")   # WHITE, BLACK, RED, BLUE, SILVER, YELLOW, GREY
    make = Column(Text, nullable=True, default="GENERIC")          # HONDA, HYUNDAI, TATA, TOYOTA, MAHINDRA, MARUTI

    camera = relationship("Camera", back_populates="sightings")

class Blacklist(Base):
    __tablename__ = "blacklist"

    plate = Column(Text, primary_key=True, index=True)
    reason = Column(Text, nullable=False)

class VehicleRegistry(Base):
    __tablename__ = "vehicle_registry"

    plate = Column(Text, primary_key=True, index=True)
    registered_type = Column(Text, nullable=False, default="SEDAN")
    registered_color = Column(Text, nullable=False, default="WHITE")
    make = Column(Text, nullable=False, default="GENERIC")
    model = Column(Text, nullable=True, default="City")
    owner_name = Column(Text, nullable=True, default="Citizen")
    is_geofence_authorized = Column(Boolean, default=False)

class GeofenceZone(Base):
    __tablename__ = "geofence_zones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(Text, nullable=False)
    zone_type = Column(Text, nullable=False, default="RESTRICTED")  # RESTRICTED, SECURITY_CORRIDOR, PEDESTRIAN, NO_PARKING
    description = Column(Text, nullable=True)
    min_lat = Column(Float, nullable=False)
    max_lat = Column(Float, nullable=False)
    min_lon = Column(Float, nullable=False)
    max_lon = Column(Float, nullable=False)
    color = Column(Text, default="#ef4444")
