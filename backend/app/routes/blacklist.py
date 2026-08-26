from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Blacklist
from app.schemas import BlacklistResponse, BlacklistCreate

router = APIRouter(prefix="/blacklist", tags=["Blacklist"])

@router.get("", response_model=List[BlacklistResponse])
def get_blacklist(db: Session = Depends(get_db)):
    return db.query(Blacklist).all()

@router.post("", response_model=BlacklistResponse, status_code=status.HTTP_201_CREATED)
def add_to_blacklist(entry: BlacklistCreate, db: Session = Depends(get_db)):
    plate_clean = entry.plate.strip().upper().replace(" ", "").replace("-", "")
    existing = db.query(Blacklist).filter(Blacklist.plate == plate_clean).first()
    if existing:
        existing.reason = entry.reason
        db.commit()
        db.refresh(existing)
        return existing
    
    new_entry = Blacklist(plate=plate_clean, reason=entry.reason)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.delete("/{plate}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_blacklist(plate: str, db: Session = Depends(get_db)):
    plate_clean = plate.strip().upper().replace(" ", "").replace("-", "")
    entry = db.query(Blacklist).filter(Blacklist.plate == plate_clean).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Plate not found in blacklist")
    db.delete(entry)
    db.commit()
    return None
