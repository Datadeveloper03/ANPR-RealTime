# 🛡️ City-Wide ANPR Vehicle Tracking & Surveillance System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-FF5722?logo=yolo&logoColor=white)](https://docs.ultralytics.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10+-5C3EE8?logo=opencv&logoColor=white)](https://opencv.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, end-to-end **Automatic Number Plate Recognition (ANPR) and Spatio-Temporal Vehicle Tracking Platform**. The system ingests distributed CCTV/RTSP camera feeds, detects license plates in real-time, reconstructs vehicle trajectories across city checkpoints, computes velocity and route anomalies via spatial algorithms, and broadcasts instant audio-visual security alerts over WebSockets.

---

## 🏛️ System Architecture Diagram

```mermaid
flowchart TD
    subgraph INGESTION["📹 1. Video & Stream Ingestion Layer"]
        A1["Physical IP / RTSP Cameras"]
        A2["CCTV Video Files (.mp4)"]
        A3["Simulated Multi-Cam Feeds"]
    end

    subgraph PIPELINE["🧠 2. AI Vision & OCR Pipeline"]
        B1["OpenCV Frame Capture"] --> B2["YOLOv8 Vehicle Detection"]
        B2 --> B3["Plate ROI Localization"]
        B3 --> B4["RapidOCR Character Extraction"]
        B4 --> B5["Indian Plate Regex & Character Normalizer"]
    end

    subgraph BACKEND["⚙️ 3. Backend & Spatial Analytics Engine"]
        C1["FastAPI REST & WebSocket Server"]
        C2["Spatio-Temporal Haversine Engine\n(Distance, Elapsed Time, Speed km/h)"]
        C3["Anomaly Detector\n(Speed > 140 km/h, Checkpoint Skips)"]
        C4["Redis PubSub Broadcaster\n(In-Memory Resilient Fallback)"]
        C5[("Database\nPostgreSQL / SQLite")]
    end

    subgraph DASHBOARD["💻 4. Command & Control Operations Dashboard"]
        D1["Interactive Leaflet Map\n(Dark Tiles & Pulsing Cam Nodes)"]
        D2["Traffic Density Heatmap Layer"]
        D3["Animated Vehicle Trajectory Playback"]
        D4["Multi-Camera CCTV Grid"]
        D5["Real-Time Audio-Visual Alerts Feed"]
        D6["Blacklist Management Portal"]
    end

    INGESTION --> PIPELINE
    PIPELINE -->|"HTTP POST /sightings"| C1
    C1 <--> C5
    C1 --> C2
    C2 --> C3
    C3 -->|"Trigger Alert"| C4
    C4 -->|"WS /alerts Broadcast"| DASHBOARD
    C1 -->|"REST API Data"| DASHBOARD
```

---

## 📋 Key Features

- **Real-Time ANPR Engine**: Powered by Ultralytics YOLOv8 and RapidOCR for high-precision vehicle detection and plate character recognition.
- **Indian Standard Plate Normalizer**: Robust regex validation (`^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$`) with heuristic OCR character confusion correction ($O \leftrightarrow 0, I \leftrightarrow 1$).
- **Spatio-Temporal Trajectory Reconstruction**: Chronological journey mapping across city camera nodes with breadcrumbs and timing metrics.
- **Speed & Route Anomaly Detection**: Automatic speed computation between camera checkpoints using Haversine distance formulas.
- **WebSocket Alert Broadcast**: Instant push notifications with audio chime on blacklist hits or speed violations.
- **Interactive Dark-Mode Dashboard**: Built with React 19, TypeScript, Leaflet, and a high-aesthetic Cyberpunk Ops theme.

---

## 🚀 Step-by-Step Execution Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** & **npm**

---

### 2. Backend Setup & Startup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd "f:\ANPR CAM\backend"
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

> 🟢 **Backend will be live at:** [http://localhost:8000](http://localhost:8000)  
> 📖 **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Frontend Setup & Startup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd "f:\ANPR CAM\frontend"
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```

> 🌐 **Open the Dashboard in your browser:** [**http://localhost:5173**](http://localhost:5173)

---

### 4. (Optional) Run the AI ANPR Pipeline on Video Feeds

To run the computer vision and OCR engine on CCTV video clips:

1. Open a third terminal and navigate to the pipeline directory:
   ```bash
   cd "f:\ANPR CAM\pipeline"
   ```

2. Install computer vision dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Generate sample synthetic multi-camera CCTV video clips (if not already generated):
   ```bash
   python sample_generator.py
   ```

4. Run the video ingestion and detection processor:
   ```bash
   python video_processor.py
   ```

---

## 🎮 Interactive Demo Traces (Try in Dashboard)

Use the search bar on [http://localhost:5173](http://localhost:5173) or click the demo chips:

| License Plate | Demo Scenario | Expected System Response |
| :--- | :--- | :--- |
| `DL01AB1234` | **Standard Journey** | Traces multi-checkpoint route from MG Road $\rightarrow$ Koramangala. |
| `MH12DE1433` | **Blacklisted Vehicle** | Instant 🔴 **RED ALERT** banner, audio chime, and wanted status flag. |
| `KA05MB4567` | **Speed Violation** | Triggers ⚡ **SPEED ANOMALY** alert ($>140\text{ km/h}$). |
| `TN09BZ9999` | **Checkpoint Skip** | Flags ⚠️ **ROUTE SKIP** anomaly between non-adjacent cameras. |

---

## 🔌 API & WebSocket Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/cameras` | Fetch all registered CCTV camera nodes and GPS coordinates. |
| `GET` | `/trajectory/{plate}` | Fetch vehicle journey with speed and anomaly analysis. |
| `GET` | `/heatmap` | Fetch aggregated traffic density points for the map layer. |
| `GET` | `/blacklist` | List all blacklisted/flagged vehicles. |
| `POST` | `/blacklist` | Add a new vehicle to the blacklist (`{plate, reason}`). |
| `DELETE` | `/blacklist/{plate}` | Remove a vehicle from the blacklist. |
| `GET` | `/sightings/recent` | Fetch latest camera detections. |
| `POST` | `/sightings` | Record new plate sighting (triggers alerts). |
| `GET` | `/stats` | Overall system telemetry and camera counts. |
| `WS` | `/alerts` | WebSocket live stream for instant alert dispatch. |

---

## 📂 Project Directory Structure

```
f:/ANPR CAM/
├── backend/                        # FastAPI REST API & Spatial Analytics
│   ├── app/
│   │   ├── main.py                 # App entry point, CORS, lifespan & WebSocket
│   │   ├── config.py               # Settings & environment configuration
│   │   ├── database.py             # SQLAlchemy database engine
│   │   ├── models.py               # Camera, Sighting, Blacklist models
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── spatial.py              # Haversine distance, speed & anomaly math
│   │   ├── pubsub.py               # Redis PubSub / in-memory alert broadcaster
│   │   ├── seed_data.py            # Initial seed data for cameras & sightings
│   │   └── routes/                 # Endpoint handlers (cameras, trajectory, etc.)
│   └── requirements.txt
├── pipeline/                       # Computer Vision, OCR & Video Ingestion
│   ├── detector.py                 # YOLOv8 vehicle detection + RapidOCR pipeline
│   ├── plate_validator.py          # Indian plate regex & OCR character correction
│   ├── sample_generator.py         # CCTV video generator with moving cars & plates
│   ├── video_processor.py          # Multi-camera stream ingestion runner
│   ├── demo_videos/                # Synthesized sample CCTV video clips (.mp4)
│   └── requirements.txt
├── frontend/                       # React 19 + TypeScript + Leaflet Dashboard
│   ├── src/
│   │   ├── App.tsx                 # Main application layout
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Telemetry header with live clock & quick stats
│   │   │   ├── MapView.tsx         # Leaflet map with dark tiles, nodes & heatmap
│   │   │   ├── TrajectoryPlayer.tsx # Animated path player with speed stats
│   │   │   ├── AlertsPanel.tsx     # WebSocket live alerts with sound toggle
│   │   │   ├── CameraFeedGrid.tsx  # Multi-camera CCTV surveillance cards
│   │   │   └── BlacklistModal.tsx  # Flagged vehicle management
│   │   └── services/               # REST API & WebSocket client services
│   └── package.json
├── PROJECT_OVERVIEW_AND_UPGRADE_GUIDE.md # Production upgrade roadmap
└── README.md                       # This comprehensive documentation
```

---

## 🔒 License
This project is open-source and available under the [MIT License](LICENSE).
