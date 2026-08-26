import os
import sys
import time
import json
import logging
import cv2
import numpy as np
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple

# Ensure backend imports are accessible
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from pipeline.plate_validator import validate_indian_plate
from app.config import settings
from app.database import SessionLocal
from app.models import Sighting, Blacklist, Camera

logging.basicConfig(level=logging.INFO, format="%(asctime)s [ANPR-DETECTOR] %(message)s")
logger = logging.getLogger("anpr.detector")

class ANPRDetector:
    def __init__(self, use_yolo: bool = True):
        self.use_yolo = use_yolo
        self.yolo_model = None
        self.ocr_engine = None
        self.redis_client = None

        self._init_models()
        self._init_redis()

    def _init_models(self):
        """Attempt to load YOLO and RapidOCR."""
        try:
            from rapidocr_onnxruntime import RapidOCR
            self.ocr_engine = RapidOCR()
            logger.info("RapidOCR initialized successfully.")
        except Exception as e:
            logger.warning(f"RapidOCR load warning ({e}). OCR fallback active.")
            self.ocr_engine = None

        if self.use_yolo:
            try:
                from ultralytics import YOLO
                # Stock YOLOv8n for vehicle detection (car, motorcycle, bus, truck)
                # COCO classes: 2: car, 3: motorcycle, 5: bus, 7: truck
                self.yolo_model = YOLO("yolov8n.pt")
                logger.info("Ultralytics YOLOv8n initialized successfully.")
            except Exception as e:
                logger.warning(f"YOLO load warning ({e}). Using computer-vision fallback.")
                self.yolo_model = None

    def _init_redis(self):
        """Optional Redis connection for publishing alerts directly."""
        try:
            import redis
            self.redis_client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=2.0)
            self.redis_client.ping()
            logger.info(f"Connected to Redis at {settings.REDIS_URL}")
        except Exception as e:
            logger.warning(f"Redis not connected in detector ({e}). Direct DB alerts active.")
            self.redis_client = None

    def detect_vehicles_and_plates(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects vehicle regions and plate crops from a video frame.
        Returns a list of detected crops with bounding boxes.
        """
        h, w = frame.shape[:2]
        candidates = []

        if self.yolo_model is not None:
            try:
                results = self.yolo_model(frame, verbose=False, classes=[2, 3, 5, 7])
                for r in results:
                    for box in r.boxes:
                        bx1, by1, bx2, by2 = map(int, box.xyxy[0].tolist())
                        bx1, by1 = max(0, bx1), max(0, by1)
                        bx2, by2 = min(w, bx2), min(h, by2)
                        
                        # Plate is typically in the bottom 40% of the vehicle bounding box
                        vehicle_crop = frame[by1:by2, bx1:bx2]
                        vh, vw = vehicle_crop.shape[:2]
                        if vh > 20 and vw > 40:
                            plate_roi = vehicle_crop[int(vh * 0.5):vh, int(vw * 0.15):int(vw * 0.85)]
                            candidates.append({
                                "crop": plate_roi,
                                "bbox": (bx1, by1, bx2, by2),
                                "conf": float(box.conf[0])
                            })
            except Exception as e:
                logger.debug(f"YOLO inference error: {e}")

        # Computer vision fallback / contour detection for license plate regions
        if not candidates:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Bilateral filter to remove noise while keeping edges sharp
            blurred = cv2.bilateralFilter(gray, 11, 17, 17)
            edged = cv2.Canny(blurred, 30, 200)
            
            contours, _ = cv2.findContours(edged, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

            for c in contours:
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                if len(approx) == 4:
                    x, y, cw, ch = cv2.boundingRect(approx)
                    aspect_ratio = cw / float(ch)
                    # License plate aspect ratio in India is typically between 2.5 and 5.0
                    if 2.0 <= aspect_ratio <= 6.0 and cw > 60 and ch > 15:
                        crop = frame[max(0, y):min(h, y+ch), max(0, x):min(w, x+cw)]
                        candidates.append({
                            "crop": crop,
                            "bbox": (x, y, x+cw, y+ch),
                            "conf": 0.88
                        })

        return candidates

    def read_plate_text(self, plate_crop: np.ndarray) -> Optional[Tuple[str, float]]:
        """
        Runs RapidOCR on the plate crop.
        """
        if plate_crop is None or plate_crop.size == 0:
            return None

        if self.ocr_engine is not None:
            try:
                ocr_results, _ = self.ocr_engine(plate_crop)
                if ocr_results:
                    for res in ocr_results:
                        text = res[1]
                        conf = float(res[2])
                        is_valid, plate_clean = validate_indian_plate(text)
                        if is_valid:
                            return plate_clean, conf
            except Exception as e:
                logger.debug(f"RapidOCR error: {e}")

        return None

    def process_frame(self, frame: np.ndarray, camera_id: int, db) -> List[Dict[str, Any]]:
        """
        Runs full pipeline on single frame:
        Detect -> OCR -> Regex Validation -> DB Insert -> Alert Push.
        """
        candidates = self.detect_vehicles_and_plates(frame)
        detected_sightings = []

        for cand in candidates:
            crop = cand["crop"]
            ocr_out = self.read_plate_text(crop)
            
            if ocr_out:
                plate, conf = ocr_out
                # Record to Database
                now = datetime.now(timezone.utc)
                sighting = Sighting(
                    plate=plate,
                    camera_id=camera_id,
                    timestamp=now,
                    confidence=conf
                )
                db.add(sighting)
                db.commit()
                db.refresh(sighting)

                logger.info(f"📍 Sighting Recorded: Plate '{plate}' at Cam #{camera_id} (Conf: {conf:.2f})")

                # Check Blacklist
                blacklist_entry = db.query(Blacklist).filter(Blacklist.plate == plate).first()
                if blacklist_entry:
                    cam = db.query(Camera).filter(Camera.id == camera_id).first()
                    alert_data = {
                        "alert_type": "BLACKLIST_HIT",
                        "plate": plate,
                        "camera_id": camera_id,
                        "camera_name": cam.name if cam else f"Camera #{camera_id}",
                        "lat": cam.lat if cam else None,
                        "lon": cam.lon if cam else None,
                        "timestamp": now.isoformat(),
                        "reason": f"⚠️ BLACKLIST MATCH: {blacklist_entry.reason}",
                        "confidence": conf
                    }
                    if self.redis_client:
                        try:
                            self.redis_client.publish(settings.REDIS_ALERT_CHANNEL, json.dumps(alert_data))
                            logger.warning(f"🚨 Published Blacklist Alert to Redis for '{plate}'!")
                        except Exception as re:
                            logger.error(f"Redis publish error: {re}")

                detected_sightings.append({
                    "plate": plate,
                    "confidence": conf,
                    "bbox": cand["bbox"]
                })

        return detected_sightings

    def process_video_file(
        self, 
        video_path: str, 
        camera_id: int, 
        frame_interval: int = 12,
        max_frames: Optional[int] = None
    ) -> int:
        """
        Processes an input video file for a specific camera.
        """
        if not os.path.exists(video_path):
            logger.error(f"Video file not found: {video_path}")
            return 0

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Failed to open video: {video_path}")
            return 0

        db = SessionLocal()
        total_detected = 0
        frame_count = 0

        try:
            logger.info(f"Starting ANPR Video Ingestion: '{video_path}' on Camera #{camera_id}")
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1
                if frame_count % frame_interval == 0:
                    sightings = self.process_frame(frame, camera_id, db)
                    total_detected += len(sightings)

                if max_frames and frame_count >= max_frames:
                    break

            logger.info(f"Finished video processing. Total frames: {frame_count}, Total valid ANPR sightings: {total_detected}")
        finally:
            cap.release()
            db.close()

        return total_detected
