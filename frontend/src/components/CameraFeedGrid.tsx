import React, { useState, useEffect, useRef } from "react";
import type { Camera, Sighting, PlaceInventory } from "../types";
import {
  Video,
  Play,
  RefreshCw,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Download,
  Maximize2,
  Layers,
  Car,
  X
} from "lucide-react";
import { api } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface CameraFeedGridProps {
  cameras: Camera[];
  recentSightings: Sighting[];
  onRefresh: () => void;
  onSelectPlate: (plate: string) => void;
}

const CAR_TEST_PRESETS = [
  { plate: "DL01AB1234", type: "SEDAN", col: "WHITE", make: "HONDA", label: "DL01AB1234 (White Honda City - Regular Transit)" },
  { plate: "MH12DE1433", type: "SUV", col: "BLACK", make: "MAHINDRA", label: "MH12DE1433 (Black Scorpio - WANTED BLACKLIST)" },
  { plate: "KA05MB4567", type: "SEDAN", col: "SILVER", make: "HYUNDAI", label: "KA05MB4567 (Silver Verna - Speed Anomaly)" },
  { plate: "TN09BZ9999", type: "TRUCK", col: "WHITE", make: "TATA", label: "TN09BZ9999 (White Truck - Appearance Mismatch)" },
  { plate: "KA04EK9081", type: "TRUCK", col: "YELLOW", make: "TATA", label: "KA04EK9081 (Yellow Truck - Geofence Violation)" },
  { plate: "KA01MJ1122", type: "HATCHBACK", col: "BLUE", make: "TATA", label: "KA01MJ1122 (Blue Altroz - Ghost Duplicate Plate)" },
  { plate: "TS07AB4040", type: "SUV", col: "WHITE", make: "TOYOTA", label: "TS07AB4040 (White Fortuner - Illegal U-Turn)" },
  { plate: "DL08CD5566", type: "SEDAN", col: "GREY", make: "SKODA", label: "DL08CD5566 (Grey Slavia - Illegal Parking/Loitering)" },
];

const CAM_VIDEO_FALLBACKS: Record<number, string> = {
  1: "cam_01_mg_road.mp4",
  2: "cam_02_indiranagar.mp4",
  3: "cam_03_domlur.mp4",
  4: "cam_04_koramangala.mp4",
  5: "cam_05_silk_board.mp4",
  6: "cam_06_electronic_city.mp4",
  7: "cam_07_mg_road_south.mp4",
  8: "cam_08_koramangala_hub.mp4",
};

// Robust Video Player Component with autoplay handling & playback status
const CameraVideoPlayer: React.FC<{
  videoUrl: string;
  camId: number;
  camName?: string;
  direction?: string;
  onInspect?: () => void;
  onInject?: () => void;
  isScanning?: boolean;
}> = ({ videoUrl, camId, direction = "NORTH", onInspect, onInject, isScanning }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [videoUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      style={{
        height: "180px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030712",
        overflow: "hidden",
        borderRadius: "8px 8px 0 0",
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Top Left Camera ID Overlay */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          fontSize: "0.68rem",
          color: "#38bdf8",
          fontFamily: "monospace",
          fontWeight: "700",
          background: "rgba(3, 7, 18, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          padding: "2px 6px",
          borderRadius: "4px",
          zIndex: 2,
        }}
      >
        CAM #{String(camId).padStart(2, "0")} [{direction}]
      </div>

      {/* Top Right Video Status Tag */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          fontSize: "0.62rem",
          color: "#38bdf8",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(3, 7, 18, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          padding: "2px 6px",
          borderRadius: "4px",
          zIndex: 2,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: isPlaying ? "#34d399" : "#f59e0b",
          }}
        />
        {isPlaying ? "30 FPS FEED" : "PAUSED"}
      </div>

      {/* Manual Play / Pause overlay if user paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          style={{
            position: "absolute",
            zIndex: 3,
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgba(56, 189, 248, 0.8)",
            border: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 0 15px rgba(56, 189, 248, 0.6)",
          }}
        >
          <Play size={20} />
        </button>
      )}

      {/* Bottom Action Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "8px",
          right: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        {onInspect && (
          <button
            onClick={onInspect}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(0, 0, 0, 0.75)",
              color: "#f8fafc",
              cursor: "pointer",
              fontSize: "0.68rem",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <Maximize2 size={10} /> Inspect
          </button>
        )}

        {onInject && (
          <button
            onClick={onInject}
            disabled={isScanning}
            style={{
              padding: "3px 10px",
              borderRadius: "4px",
              border: "none",
              background: isScanning ? "#0284c7" : "rgba(56, 189, 248, 0.4)",
              color: "#ffffff",
              fontSize: "0.68rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backdropFilter: "blur(4px)",
              marginLeft: "auto",
            }}
          >
            <Play size={9} /> {isScanning ? "Scanning..." : "Inject Car"}
          </button>
        )}
      </div>
    </div>
  );
};

export const CameraFeedGrid: React.FC<CameraFeedGridProps> = ({
  cameras,
  recentSightings,
  onRefresh,
  onSelectPlate,
}) => {
  const [placeInventories, setPlaceInventories] = useState<PlaceInventory[]>([]);
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState<string>("ALL");
  const [activeSimCam, setActiveSimCam] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modal / Inspection states
  const [inspectedCam, setInspectedCam] = useState<Camera | null>(null);
  const [isMatrixViewOpen, setIsMatrixViewOpen] = useState<boolean>(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInspectedCam(null);
        setIsMatrixViewOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadPlaces = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPlaceInventories();
      setPlaceInventories(data);
    } catch (e) {
      console.error("Failed to load place inventories:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, [cameras, recentSightings]);

  const handleExportCsv = (placeName = "ALL") => {
    setIsExporting(true);
    try {
      const url = `${API_BASE_URL}/sightings/export/csv${
        placeName !== "ALL" ? `?place_name=${encodeURIComponent(placeName)}` : ""
      }`;

      const a = document.createElement("a");
      a.href = url;
      a.download = `anpr_cctv_evaluated_sightings_${placeName
        .toLowerCase()
        .replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const simulateCameraDetection = async (camId: number, specificPreset?: typeof CAR_TEST_PRESETS[0]) => {
    setActiveSimCam(camId);
    try {
      const chosen =
        specificPreset ||
        CAR_TEST_PRESETS[Math.floor(Math.random() * CAR_TEST_PRESETS.length)];
      await api.recordSighting(
        chosen.plate,
        camId,
        0.98,
        chosen.type,
        chosen.col,
        chosen.make
      );
      await loadPlaces();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setActiveSimCam(null), 1200);
    }
  };

  const getVideoSrc = (cam: Camera) => {
    if (cam.video_url && cam.video_url.length > 0) {
      return cam.video_url.startsWith("http")
        ? cam.video_url
        : `${API_BASE_URL}${cam.video_url}`;
    }
    const fallbackFile = CAM_VIDEO_FALLBACKS[cam.id] || `cam_${String(cam.id).padStart(2, "0")}.mp4`;
    return `${API_BASE_URL}/videos/${fallbackFile}`;
  };

  const filteredPlaces =
    selectedPlaceFilter === "ALL"
      ? placeInventories
      : placeInventories.filter((p) => p.place_name === selectedPlaceFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header & Sector Filter Bar */}
      <div className="glass-panel" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#f8fafc",
              }}
            >
              <Video size={24} color="#38bdf8" /> City CCTV Camera Feeds & Video Streams
            </h2>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Real-time multi-lane optical feeds with YOLOv8 vehicle detection, HSRP recognition, and sector audit logs
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Launch 8-Cam Matrix Grid View */}
            <button
              onClick={() => setIsMatrixViewOpen(true)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                background:
                  "linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.3) 100%)",
                color: "#c084fc",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 14px rgba(168, 85, 247, 0.2)",
              }}
            >
              <Layers size={15} /> Multi-Cam 8x Matrix View
            </button>

            {/* Export All CSV Button */}
            <button
              onClick={() => handleExportCsv(selectedPlaceFilter)}
              disabled={isExporting}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                background:
                  "linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(3, 105, 161, 0.25) 100%)",
                color: "#38bdf8",
                cursor: isExporting ? "wait" : "pointer",
                fontSize: "0.82rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 12px rgba(56, 189, 248, 0.15)",
              }}
            >
              <Download size={15} />
              {isExporting
                ? "Exporting CSV..."
                : selectedPlaceFilter === "ALL"
                ? "Export All Evaluated CSV"
                : `Export ${selectedPlaceFilter} CSV`}
            </button>

            <button
              onClick={() => {
                loadPlaces();
                onRefresh();
              }}
              disabled={isLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#f8fafc",
                cursor: "pointer",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              <RefreshCw size={14} className={isLoading ? "radar-pulse" : ""} /> Refresh Feeds
            </button>
          </div>
        </div>

        {/* Sector Filter Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "#94a3b8",
              fontWeight: "600",
              marginRight: "4px",
            }}
          >
            FILTER SECTOR:
          </span>
          <button
            onClick={() => setSelectedPlaceFilter("ALL")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: "pointer",
              background:
                selectedPlaceFilter === "ALL"
                  ? "rgba(56, 189, 248, 0.25)"
                  : "rgba(10, 13, 20, 0.7)",
              color: selectedPlaceFilter === "ALL" ? "#38bdf8" : "#94a3b8",
              borderBottom:
                selectedPlaceFilter === "ALL"
                  ? "2px solid #38bdf8"
                  : "2px solid transparent",
            }}
          >
            All Sectors ({placeInventories.length})
          </button>
          {placeInventories.map((place) => (
            <button
              key={place.place_name}
              onClick={() => setSelectedPlaceFilter(place.place_name)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                background:
                  selectedPlaceFilter === place.place_name
                    ? "rgba(56, 189, 248, 0.25)"
                    : "rgba(10, 13, 20, 0.7)",
                color:
                  selectedPlaceFilter === place.place_name ? "#38bdf8" : "#94a3b8",
                borderBottom:
                  selectedPlaceFilter === place.place_name
                    ? "2px solid #38bdf8"
                    : "2px solid transparent",
              }}
            >
              {place.place_name} ({place.camera_count} Cams)
            </button>
          ))}
        </div>
      </div>

      {/* Place Sectors Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {filteredPlaces.map((place) => {
          const isRestricted = place.zone_type === "RESTRICTED_GEOFENCE";
          const isNoParking = place.zone_type === "NO_PARKING";
          const isIntersection = place.zone_type === "INTERSECTION";

          let zoneBadgeBg = "rgba(56, 189, 248, 0.15)";
          let zoneBadgeBorder = "rgba(56, 189, 248, 0.3)";
          let zoneBadgeColor = "#38bdf8";
          let zoneLabel = "STANDARD CORRIDOR";

          if (isRestricted) {
            zoneBadgeBg = "rgba(239, 68, 68, 0.2)";
            zoneBadgeBorder = "rgba(239, 68, 68, 0.4)";
            zoneBadgeColor = "#f87171";
            zoneLabel = "RESTRICTED GEOFENCE ZONE";
          } else if (isNoParking) {
            zoneBadgeBg = "rgba(245, 158, 11, 0.2)";
            zoneBadgeBorder = "rgba(245, 158, 11, 0.4)";
            zoneBadgeColor = "#fbbf24";
            zoneLabel = "STRICT NO-PARKING ZONE";
          } else if (isIntersection) {
            zoneBadgeBg = "rgba(168, 85, 247, 0.2)";
            zoneBadgeBorder = "rgba(168, 85, 247, 0.4)";
            zoneBadgeColor = "#c084fc";
            zoneLabel = "CONTROLLED INTERSECTION";
          }

          return (
            <div
              key={place.place_name}
              className="glass-panel"
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Place Inventory Header */}
              <div
                style={{
                  padding: "16px 20px",
                  background:
                    "linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MapPin size={20} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          color: "#f8fafc",
                        }}
                      >
                        {place.place_name.toUpperCase()} SECTOR INVENTORY
                      </h3>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: zoneBadgeBg,
                          border: `1px solid ${zoneBadgeBorder}`,
                          color: zoneBadgeColor,
                          fontWeight: "700",
                        }}
                      >
                        {zoneLabel}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        marginTop: "2px",
                      }}
                    >
                      Sensor Nodes: <strong>{place.camera_count} Active CCTVs</strong> | Total Today:{" "}
                      <strong style={{ color: "#34d399" }}>
                        {place.total_sightings_today} Sightings
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {place.anomaly_count > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        color: "#f87171",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      <AlertTriangle size={14} />
                      {place.anomaly_count} Anomalies Detected
                    </div>
                  )}

                  <button
                    onClick={() => handleExportCsv(place.place_name)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      color: "#38bdf8",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title={`Export evaluated CCTV sightings for ${place.place_name} to CSV`}
                  >
                    <Download size={13} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Two Column Layout: Left Optical Video Feeds | Right Place Chronological Timeline */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1fr",
                  gap: "0",
                  minHeight: "420px",
                }}
              >
                {/* Left Column: Place Camera Video Viewports */}
                <div
                  style={{
                    padding: "16px",
                    borderRight: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    background: "rgba(10, 13, 20, 0.5)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Eye size={14} color="#38bdf8" /> OPTICAL SENSOR STREAMS (
                      {place.place_name.toUpperCase()})
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                      Multi-Lane Video Feeds
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: place.cameras.length > 1 ? "1fr 1fr" : "1fr",
                      gap: "14px",
                    }}
                  >
                    {place.cameras.map((cam) => {
                      const isScanning = activeSimCam === cam.id;
                      const videoUrl = getVideoSrc(cam);

                      return (
                        <div
                          key={cam.id}
                          style={{
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: isScanning
                              ? "1.5px solid #38bdf8"
                              : "1px solid rgba(255, 255, 255, 0.1)",
                            background: "#05070c",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5)",
                          }}
                        >
                          {/* Live Video Player */}
                          <CameraVideoPlayer
                            videoUrl={videoUrl}
                            camId={cam.id}
                            camName={cam.name}
                            direction={cam.direction}
                            onInspect={() => setInspectedCam(cam)}
                            onInject={() => simulateCameraDetection(cam.id)}
                            isScanning={isScanning}
                          />

                          {/* Mini Details Footer */}
                          <div
                            style={{
                              padding: "10px 12px",
                              background: "rgba(15, 23, 42, 0.7)",
                              fontSize: "0.72rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "#f1f5f9",
                                fontWeight: "600",
                              }}
                            >
                              <span>{cam.name}</span>
                              <strong style={{ color: "#34d399" }}>
                                {cam.total_sightings} hits
                              </strong>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "#94a3b8",
                                fontSize: "0.68rem",
                              }}
                            >
                              <span>
                                Lat: {cam.lat.toFixed(4)}, Lon: {cam.lon.toFixed(4)}
                              </span>
                              <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>
                                {cam.video_filename || CAM_VIDEO_FALLBACKS[cam.id]}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Place Chronological Event Timeline */}
                <div
                  style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: "rgba(15, 23, 42, 0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        color: "#38bdf8",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <Clock size={15} color="#38bdf8" /> LOCATION EVENT TIMELINE:{" "}
                      {place.place_name.toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                      Chronological Order
                    </span>
                  </div>

                  {/* Timeline Events List */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "380px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {place.events_timeline && place.events_timeline.length > 0 ? (
                      place.events_timeline.map((event, idx) => {
                        return (
                          <div
                            key={event.sighting_id || idx}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: event.is_anomaly
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(10, 13, 20, 0.75)",
                              border: event.is_anomaly
                                ? "1px solid rgba(239, 68, 68, 0.3)"
                                : "1px solid rgba(255, 255, 255, 0.06)",
                              position: "relative",
                            }}
                          >
                            {/* Sequence Badge */}
                            <div
                              style={{
                                minWidth: "60px",
                                padding: "3px 6px",
                                borderRadius: "5px",
                                background: event.is_anomaly ? "#ef4444" : "#0284c7",
                                color: "#ffffff",
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                textAlign: "center",
                                fontFamily: "monospace",
                              }}
                            >
                              Event #{event.event_sequence || idx + 1}
                            </div>

                            {/* Event Details */}
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "0.85rem",
                                      fontWeight: "700",
                                      color: event.is_anomaly ? "#fca5a5" : "#38bdf8",
                                    }}
                                  >
                                    {event.plate}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      padding: "1px 5px",
                                      borderRadius: "3px",
                                      background: "rgba(255, 255, 255, 0.08)",
                                      color: "#cbd5e1",
                                    }}
                                  >
                                    {event.vehicle_color} {event.vehicle_type}
                                  </span>
                                </div>

                                <button
                                  onClick={() => onSelectPlate(event.plate)}
                                  style={{
                                    padding: "2px 6px",
                                    fontSize: "0.68rem",
                                    borderRadius: "4px",
                                    background: "rgba(56, 189, 248, 0.15)",
                                    color: "#38bdf8",
                                    border: "1px solid rgba(56, 189, 248, 0.3)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  Trace <ChevronRight size={10} />
                                </button>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginTop: "4px",
                                  fontSize: "0.7rem",
                                  color: "#94a3b8",
                                }}
                              >
                                <span>{event.camera_name}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                  <Clock size={10} />{" "}
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              </div>

                              {event.is_anomaly && event.anomaly_reason && (
                                <div
                                  style={{
                                    fontSize: "0.68rem",
                                    color: "#f87171",
                                    marginTop: "4px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {event.anomaly_reason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          padding: "30px 10px",
                          textAlign: "center",
                          color: "#64748b",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CheckCircle2 size={24} color="#334155" />
                        <div style={{ fontSize: "0.78rem" }}>
                          No events recorded for this sector yet.
                        </div>
                        <div style={{ fontSize: "0.7rem" }}>
                          Click "Inject Car" on any camera feed to simulate sightings.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Camera Feed Inspection Modal */}
      {inspectedCam && (
        <div
          onClick={() => setInspectedCam(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(10px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "pointer",
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "880px",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1.5px solid rgba(56, 189, 248, 0.5)",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9)",
              display: "flex",
              flexDirection: "column",
              cursor: "default",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Video size={22} color="#38bdf8" />
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#f8fafc" }}>
                    {inspectedCam.name} [CAM #{String(inspectedCam.id).padStart(2, "0")}]
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Sector: {inspectedCam.place_name} | Direction: {inspectedCam.direction} | Optical 30FPS Feed
                  </span>
                </div>
              </div>

              {/* Close Button Top Right */}
              <button
                onClick={() => setInspectedCam(null)}
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#fca5a5",
                  fontSize: "0.80rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                <X size={16} /> Close (Esc)
              </button>
            </div>

            {/* Modal Video Player Viewport */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "440px",
                background: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <video
                src={getVideoSrc(inspectedCam)}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Video Overlay Telemetry HUD */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: "rgba(0, 0, 0, 0.85)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.74rem",
                  fontFamily: "monospace",
                  color: "#38bdf8",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <div>OPTICAL TELEMETRY: CAM-{String(inspectedCam.id).padStart(2, "0")}</div>
                <div style={{ color: "#94a3b8" }}>
                  LAT: {inspectedCam.lat.toFixed(4)} | LON: {inspectedCam.lon.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Car Preset Injector Controls */}
            <div
              style={{
                padding: "16px 20px",
                background: "#0b0f19",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Car size={15} /> INJECT TARGET VEHICLE INTO THIS CAMERA FEED:
                </div>
                <button
                  onClick={() => setInspectedCam(null)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                  }}
                >
                  Done
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {CAR_TEST_PRESETS.map((preset) => (
                  <button
                    key={preset.plate}
                    onClick={() => simulateCameraDetection(inspectedCam.id, preset)}
                    disabled={activeSimCam === inspectedCam.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#f8fafc",
                      fontSize: "0.75rem",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{preset.label}</span>
                    <Play size={12} color="#38bdf8" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Multi-Camera 8x Matrix View Modal */}
      {isMatrixViewOpen && (
        <div
          onClick={() => setIsMatrixViewOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(10px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              cursor: "default",
            }}
          >
            {/* Matrix Header */}
            <div
              style={{
                padding: "12px 20px",
                background: "#0f172a",
                borderRadius: "10px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(168, 85, 247, 0.4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Layers size={22} color="#c084fc" />
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#f8fafc" }}>
                    CITY-WIDE 8-CAMERA VIDEO MATRIX
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Synchronized Optical Video Feeds Across All Bangalore Sectors
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMatrixViewOpen(false)}
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: "#fca5a5",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={16} /> Close (Esc)
              </button>
            </div>

            {/* 8-Camera 4x2 Video Grid */}
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)",
                gap: "10px",
                overflow: "hidden",
              }}
            >
              {cameras.map((cam) => {
                const videoUrl = getVideoSrc(cam);
                return (
                  <div
                    key={cam.id}
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      background: "#000000",
                    }}
                  >
                    <video
                      src={videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* Overlays */}
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "6px",
                        background: "rgba(0, 0, 0, 0.8)",
                        color: "#38bdf8",
                        fontSize: "0.62rem",
                        fontFamily: "monospace",
                        padding: "2px 5px",
                        borderRadius: "3px",
                      }}
                    >
                      CAM #{String(cam.id).padStart(2, "0")} [{cam.place_name}]
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "6px",
                        right: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.62rem",
                          color: "#ffffff",
                          background: "rgba(0, 0, 0, 0.75)",
                          padding: "2px 5px",
                          borderRadius: "3px",
                        }}
                      >
                        {cam.name}
                      </span>

                      <button
                        onClick={() => simulateCameraDetection(cam.id)}
                        style={{
                          padding: "2px 6px",
                          borderRadius: "3px",
                          border: "none",
                          background: "#0284c7",
                          color: "#fff",
                          fontSize: "0.60rem",
                          cursor: "pointer",
                          fontWeight: "700",
                        }}
                      >
                        + Detect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
