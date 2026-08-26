Here is the complete directory-by-directory overview of every Python (`.py`) file in the project, detailing its location and exact purpose:

---

## 📁 1. `backend/app/` (FastAPI Core & Telemetry Engine)

| File Path | Module Name | What It Does |
| :--- | :--- | :--- |
| [`backend/app/main.py`](file:///f:/ANPR%20CAM/backend/app/main.py) | **Main Application** | The primary entry point. Initializes FastAPI, CORS middleware, lifespan events (starts database and PubSub broadcaster), and registers all API & WebSocket route handlers. |
| [`backend/app/config.py`](file:///f:/ANPR%20CAM/backend/app/config.py) | **Settings & Environment** | Loads environment settings (`DATABASE_URL`, `REDIS_URL`, CORS origins, speed threshold values like `MAX_PLAUSIBLE_SPEED_KMH = 140.0`). |
| [`backend/app/database.py`](file:///f:/ANPR%20CAM/backend/app/database.py) | **Database Connection** | Configures the SQLAlchemy database engine, session factory (`SessionLocal`), and `get_db` dependency for SQLite / PostgreSQL. |
| [`backend/app/models.py`](file:///f:/ANPR%20CAM/backend/app/models.py) | **Database Models** | Defines database tables: <br>• `Camera` (id, name, lat, lon)<br>• `Sighting` (id, plate, camera_id, timestamp, confidence)<br>• `Blacklist` (plate, reason, created_at) |
| [`backend/app/schemas.py`](file:///f:/ANPR%20CAM/backend/app/schemas.py) | **Pydantic Schemas** | Defines data serialization and validation types for API requests, responses, trajectory points, and alert payloads. |
| [`backend/app/spatial.py`](file:///f:/ANPR%20CAM/backend/app/spatial.py) | **Spatial & Anomaly Math** | Contains Haversine mathematical formulas to compute geographic distance (km), velocity (km/h) between checkpoints, and detects route skip / speed anomalies. |
| [`backend/app/pubsub.py`](file:///f:/ANPR%20CAM/backend/app/pubsub.py) | **PubSub Broadcaster** | Manages real-time alert broadcasting. Connects to Redis PubSub if available, with an automatic in-memory fallback for local zero-config testing. |
| [`backend/app/seed_data.py`](file:///f:/ANPR%20CAM/backend/app/seed_data.py) | **Database Seeder** | Seeds initial camera nodes across Bangalore/Delhi metro coordinates, along with sample test trajectories and blacklisted vehicles. |

---

## 📁 2. `backend/app/routes/` (API & WebSocket Endpoints)

| File Path | Route Prefix | What It Does |
| :--- | :--- | :--- |
| [`backend/app/routes/cameras.py`](file:///f:/ANPR%20CAM/backend/app/routes/cameras.py) | `/cameras` | Returns the list of all registered CCTV camera nodes with their GPS latitude & longitude coordinates. |
| [`backend/app/routes/trajectory.py`](file:///f:/ANPR%20CAM/backend/app/routes/trajectory.py) | `/trajectory/{plate}` | Reconstructs the complete chronological path of a vehicle across all cameras, running spatial math to detect anomalies. |
| [`backend/app/routes/heatmap.py`](file:///f:/ANPR%20CAM/backend/app/routes/heatmap.py) | `/heatmap` | Aggregates sighting frequencies by camera coordinates to generate density data for the Leaflet traffic heatmap layer. |
| [`backend/app/routes/blacklist.py`](file:///f:/ANPR%20CAM/backend/app/routes/blacklist.py) | `/blacklist` | Provides endpoints to fetch, add, or remove flagged / wanted license plates. |
| [`backend/app/routes/sightings.py`](file:///f:/ANPR%20CAM/backend/app/routes/sightings.py) | `/sightings` & `/stats` | Handles ingestion of new plate sightings from cameras (`POST /sightings`), recent sightings feed, and system dashboard statistics. |
| [`backend/app/routes/alerts.py`](file:///f:/ANPR%20CAM/backend/app/routes/alerts.py) | `/alerts` | WebSocket endpoint (`ws://localhost:8000/alerts`) that pushes instant live alerts to connected dashboards. |

---

## 📁 3. `pipeline/` (Computer Vision, OCR & Video Ingestion)

| File Path | Component | What It Does |
| :--- | :--- | :--- |
| [`pipeline/detector.py`](file:///f:/ANPR%20CAM/pipeline/detector.py) | **ANPR Detector** | Core computer vision engine. Uses **YOLOv8** (`yolov8n.pt`) to detect vehicles, crops plate regions, runs **RapidOCR**, validates results, and commits sightings to the database. |
| [`pipeline/plate_validator.py`](file:///f:/ANPR%20CAM/pipeline/plate_validator.py) | **Plate Regex & Normalizer** | Validates text against Indian plate regex (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`) and corrects common OCR character mix-ups (like `O` $\leftrightarrow$ `0`, `I` $\leftrightarrow$ `1`, `B` $\leftrightarrow$ `8`). |
| [`pipeline/sample_generator.py`](file:///f:/ANPR%20CAM/pipeline/sample_generator.py) | **Synthetic Video Generator** | Uses OpenCV to synthesize realistic 24 FPS multi-camera CCTV video clips with moving cars, license plates, asphalt textures, and timestamp overlays. |
| [`pipeline/video_processor.py`](file:///f:/ANPR%20CAM/pipeline/video_processor.py) | **Multi-Cam Stream Processor** | Runs multi-camera video feed processing loops, allowing sequential or parallel batch ingestion into the ANPR engine. |