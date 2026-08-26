from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    sightings = relationship("Sighting", back_populates="camera", cascade="all, delete-orphan")

class Sighting(Base):
    __tablename__ = "sightings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate = Column(Text, nullable=False, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    confidence = Column(Float, default=1.0)

    camera = relationship("Camera", back_populates="sightings")

class Blacklist(Base):
    __tablename__ = "blacklist"

    plate = Column(Text, primary_key=True, index=True)
    reason = Column(Text, nullable=False)
