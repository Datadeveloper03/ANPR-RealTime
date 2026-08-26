# 🛡️ City-Wide ANPR Vehicle Tracking System
## Comprehensive Architecture, Component Audit & Real-Time Upgrade Guide

---

## 1. 📖 Executive Overview: What Does This Project Do?

The **City-Wide ANPR (Automatic Number Plate Recognition) Vehicle Tracking System** is an end-to-end intelligent surveillance and traffic monitoring platform. It is engineered to ingest video feeds from distributed city surveillance cameras, detect and recognize vehicle license plates, compute spatio-temporal trajectories across camera nodes, detect behavioral & speed anomalies, and broadcast instant security alerts via WebSockets.

```
                  ┌────────────────────────────────────────┐
                  │      CCTV / RTSP / Video Feeds         │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────────┐
                  │       ANPR Detection Pipeline          │
                  │   • YOLO Vehicle / Plate Detection     │
                  │   • RapidOCR Character Recognition     │
                  │   • Indian Plate Regex Normalization   │
                  └──────────────────┬─────────────────────┘
                                     │ (HTTP POST Sightings)
                                     ▼
                  ┌────────────────────────────────────────┐
                  │            FastAPI Backend             │
                  │   • Trajectory Reconstruction          │
                  │   • Haversine Velocity / Anomaly Math  │
                  │   • Redis PubSub Alert Dispatcher      │
                  │   • SQLAlchemy (PostgreSQL / SQLite)   │
                  └─────────────┬──────────────────────────┘
                                │ (REST API + WebSockets)
                                ▼
                  ┌────────────────────────────────────────┐
                  │      React + Leaflet Dashboard         │
                  │   • Interactive Map & Heatmap Layer    │
                  │   • Trajectory Playback with Timeline  │
                  │   • Real-Time Audio-Visual Alerts      │
                  │   • Multi-Camera CCTV Monitoring Grid  │
                  │   • Blacklist Management Portal        │
                  └────────────────────────────────────────┘
```

---

## 2. 🧩 Subsystem & Component Status Audit

Every core subsystem has been created and verified:

| Subsystem | File / Module | Status | What It Accomplishes |
| :--- | :--- | :---: | :--- |
| **FastAPI Core** | [`backend/app/main.py`](file:///f:/ANPR%20CAM/backend/app/main.py) | ✅ Complete | Manages app lifespan, database auto-migration, router aggregation, CORS middleware, and WebSocket server. |
| **Spatial Engine** | [`backend/app/spatial.py`](file:///f:/ANPR%20CAM/backend/app/spatial.py) | ✅ Complete | Uses Haversine formulas to compute distance in km, elapsed time, velocity (km/h), and route jump anomalies. |
| **PubSub Dispatcher** | [`backend/app/pubsub.py`](file:///f:/ANPR%20CAM/backend/app/pubsub.py) | ✅ Complete | Broadcasts alerts across worker instances using Redis PubSub with an in-memory fallback for local execution. |
| **Database Models** | [`backend/app/models.py`](file:///f:/ANPR%20CAM/backend/app/models.py) | ✅ Complete | Defines SQLAlchemy schemas for `Camera`, `Sighting`, and `Blacklist`. |
| **API Endpoints** | [`backend/app/routes/`](file:///f:/ANPR%20CAM/backend/app/routes) | ✅ Complete | <ul><li>`GET /cameras`: Camera list and geo-coordinates</li><li>`GET /trajectory/{plate}`: Chronological vehicle path with anomaly flags</li><li>`GET /heatmap`: Traffic density coordinates</li><li>`GET/POST/DELETE /blacklist`: Flagged vehicles management</li><li>`GET /sightings/recent`, `POST /sightings`: Sighting ingestion</li><li>`WS /alerts`: Live WebSocket alert stream</li><li>`GET /stats`: Overall telemetry metrics</li></ul> |
| **Plate Validator** | [`pipeline/plate_validator.py`](file:///f:/ANPR%20CAM/pipeline/plate_validator.py) | ✅ Complete | Validates against Indian standard regex (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`) and performs OCR character normalization (e.g., `O` $\leftrightarrow$ `0`, `I` $\leftrightarrow$ `1`). |
| **ANPR Detector** | [`pipeline/detector.py`](file:///f:/ANPR%20CAM/pipeline/detector.py) | ✅ Complete | Detects vehicles/plates with YOLOv8 and RapidOCR with resilient fallback for headless environments. |
| **Synthetic Feeds** | [`pipeline/sample_generator.py`](file:///f:/ANPR%20CAM/pipeline/sample_generator.py) | ✅ Complete | Synthesizes realistic 24 FPS multi-camera CCTV footage with timestamp watermarks, moving cars, and plates. |
| **Interactive Map** | [`frontend/src/components/MapView.tsx`](file:///f:/ANPR%20CAM/frontend/src/components/MapView.tsx) | ✅ Complete | Leaflet map with custom dark tiles, animated camera nodes, vehicle path polylines, and dynamic heatmap. |
| **Playback Engine** | [`frontend/src/components/TrajectoryPlayer.tsx`](file:///f:/ANPR%20CAM/frontend/src/components/TrajectoryPlayer.tsx) | ✅ Complete | Scrubber timeline, step-by-step playback, speed stats, and anomaly callouts. |
| **Alert Feed** | [`frontend/src/components/AlertsPanel.tsx`](file:///f:/ANPR%20CAM/frontend/src/components/AlertsPanel.tsx) | ✅ Complete | Live streaming alerts with audio chimes, severity badges, and one-click "Track on Map" jump. |
| **CCTV Grid** | [`frontend/src/components/CameraFeedGrid.tsx`](file:///f:/ANPR%20CAM/frontend/src/components/CameraFeedGrid.tsx) | ✅ Complete | Multi-cam live surveillance cards with detection overlays, recent sightings, and manual simulation triggers. |
| **Blacklist Portal** | [`frontend/src/components/BlacklistModal.tsx`](file:///f:/ANPR%20CAM/frontend/src/components/BlacklistModal.tsx) | ✅ Complete | UI to add and remove hotlisted license plates with reason tracking. |

---

## 3. ⚡ How the Real-Time Workflow Operates

1. **Detection & Ingestion**:
   - When a vehicle enters any camera's field of view, the pipeline captures the frame, crops the license plate, performs OCR, and sends a `POST /sightings` request to the backend.
2. **Instant Correlation & Spatial Verification**:
   - The backend looks up the plate against the `Blacklist` table.
   - It checks the vehicle's last known camera position and timestamp. If the velocity between checkpoints exceeds the speed threshold (e.g. $> 140$ km/h), a `SPEED_ANOMALY` is calculated.
3. **Real-time Alert Broadcast**:
   - If an anomaly or blacklist match occurs, the event is immediately pushed to Redis PubSub and broadcast via WebSocket to all connected browser dashboards.
4. **Visual & Audio Alert**:
   - The dashboard rings a chime, flashes an alert banner, logs the event in the **Live Intercept Alerts** feed, and allows operators to replay the entire multi-camera trajectory with a single click.

---

## 4. 🚀 Real-Time Production Upgrade Roadmap

To scale this system from local simulation to enterprise production with physical IP/RTSP cameras, follow these upgrade phases:

### Step 1: Connecting Real Physical RTSP / IP Cameras
Update `pipeline/video_processor.py` or run a camera ingestion worker pointing directly to your camera's RTSP stream URLs:
```python
CAMERA_STREAMS = {
    1: "rtsp://admin:password@192.168.1.101:554/stream1", # Camera 1 (MG Road)
    2: "rtsp://admin:password@192.168.1.102:554/stream1", # Camera 2 (Indiranagar)
    3: "rtsp://admin:password@192.168.1.103:554/stream1", # Camera 3 (Domlur)
}
```
*Tip: Use OpenCV `cv2.VideoCapture(rtsp_url)` or GStreamer / FFmpeg pipelines with hardware decoding (NVDEC) for multi-stream ingestion.*

### Step 2: GPU Acceleration with TensorRT / CUDA
For real-time 30+ FPS processing on multiple HD feeds:
1. Export the YOLOv8 model to TensorRT:
   ```bash
   yolo export model=yolov8n.pt format=engine device=0 half=True
   ```
2. Enable CUDA in `RapidOCR`:
   ```python
   engine = RapidOCR(use_cuda=True)
   ```
3. Deploy on edge devices like **NVIDIA Jetson Orin Nano / AGX** or GPU cloud servers (e.g. AWS g4dn / Azure NC-series).

### Step 3: Upgrade Database to Managed PostgreSQL (Supabase / AWS RDS)
In `backend/.env`, replace the local SQLite path with your production PostgreSQL connection string:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```
*PostgreSQL automatically benefits from indexing on `sightings(plate, timestamp)` for sub-millisecond trajectory queries over millions of records.*

### Step 4: Stand up Redis for Distributed PubSub & Caching
In `backend/.env`, point to your Redis instance (Redis Cloud / Upstash / local Redis):
```env
REDIS_URL=redis://default:[PASSWORD]@[REDIS_HOST]:6379/0
```
This allows multiple backend replicas behind a load balancer (Nginx / Cloudflare) to share a single alert broadcast channel.

### Step 5: WebRTC / HLS Live Video Streaming to Frontend
To show live video streams directly in the **CCTV Grid**:
- Run **MediaMTX** or **go2rtc** RTSP-to-WebRTC/HLS gateway.
- Embed `<video>` elements using WebRTC in [`CameraFeedGrid.tsx`](file:///f:/ANPR%20CAM/frontend/src/components/CameraFeedGrid.tsx) for sub-second latency video playback.

---

## 5. 🛠️ How to Run the Entire System

### 1. Start Backend Server
```bash
cd "f:\ANPR CAM\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend Dashboard
```bash
cd "f:\ANPR CAM\frontend"
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. (Optional) Run Live ANPR Processing Pipeline
```bash
cd "f:\ANPR CAM\pipeline"
python video_processor.py
```

---

## 6. 🌐 Live Service Endpoints Summary

- **Frontend Dashboard**: `http://localhost:5173/`
- **Backend API Root**: `http://localhost:8000/`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Live WebSocket Stream**: `ws://localhost:8000/alerts`
