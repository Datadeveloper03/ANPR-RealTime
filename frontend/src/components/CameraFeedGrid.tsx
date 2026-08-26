import React, { useState } from "react";
import type { Camera, Sighting } from "../types";
import { Video, Play, RefreshCw, Radio } from "lucide-react";
import { api } from "../services/api";

interface CameraFeedGridProps {
  cameras: Camera[];
  recentSightings: Sighting[];
  onRefresh: () => void;
  onSelectPlate: (plate: string) => void;
}

export const CameraFeedGrid: React.FC<CameraFeedGridProps> = ({
  cameras,
  recentSightings,
  onRefresh,
  onSelectPlate,
}) => {
  const [activeSimCam, setActiveSimCam] = useState<number | null>(null);

  const simulateCameraDetection = async (camId: number) => {
    setActiveSimCam(camId);
    try {
      // Pick random test plate
      const plates = ["DL01AB1234", "MH12DE1433", "KA05MB4567", "TN09BZ9999", "KA01MJ1122"];
      const randomPlate = plates[Math.floor(Math.random() * plates.length)];
      await api.recordSighting(randomPlate, camId, 0.96);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setActiveSimCam(null), 1200);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            <Video size={20} color="#38bdf8" /> City CCTV Surveillance Grid ({cameras.length} Active Nodes)
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>
            Real-time optical feed processing with YOLO vehicle localization and RapidOCR plate recognition
          </p>
        </div>
        <button
          onClick={onRefresh}
          style={{
            padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "#f8fafc", cursor: "pointer",
            fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <RefreshCw size={14} /> Refresh Grid
        </button>
      </div>

      {/* Grid of CCTV Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {cameras.map((cam) => {
          const camSightings = recentSightings.filter((s) => s.camera_id === cam.id);
          const latestSighting = camSightings[0];
          const isScanning = activeSimCam === cam.id;

          return (
            <div
              key={cam.id}
              className="glass-panel"
              style={{
                overflow: "hidden",
                border: isScanning ? "1px solid #38bdf8" : "1px solid var(--border-color)",
                transition: "all 0.3s"
              }}
            >
              {/* Simulated Camera Viewport */}
              <div style={{
                height: "190px", background: "#05070c", position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderBottom: "1px solid var(--border-color)"
              }}>
                {/* CCTV Telemetry Overlay */}
                <div style={{
                  position: "absolute", top: "10px", left: "10px",
                  fontSize: "0.72rem", color: "#38bdf8", fontFamily: "monospace",
                  background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "4px"
                }}>
                  [CAM-{cam.id.toString().padStart(2, "0")}] {cam.name.toUpperCase()}
                </div>

                <div style={{
                  position: "absolute", top: "10px", right: "10px",
                  fontSize: "0.7rem", color: "#ef4444", fontWeight: "700",
                  display: "flex", alignItems: "center", gap: "4px",
                  background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "4px"
                }}>
                  <Radio size={10} className="radar-pulse-red" /> LIVE 1080P
                </div>

                {/* Simulated Road / Camera View */}
                <div style={{
                  width: "100%", height: "100%", opacity: 0.25,
                  backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}></div>

                {/* Simulated Vehicle & Bounding Box */}
                {latestSighting && (
                  <div style={{
                    position: "absolute",
                    border: "2px solid #38bdf8",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "rgba(56, 189, 248, 0.12)",
                    boxShadow: "0 0 15px rgba(56, 189, 248, 0.3)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                  }}>
                    <div style={{
                      fontSize: "0.62rem", color: "#38bdf8", fontWeight: "700",
                      background: "rgba(10, 13, 20, 0.9)", padding: "1px 5px", borderRadius: "3px"
                    }}>
                      YOLOv8: VEHICLE ({(latestSighting.confidence * 100).toFixed(0)}%)
                    </div>
                    <div style={{
                      fontFamily: "monospace", fontSize: "1rem", fontWeight: "800",
                      color: "#ffffff", background: "#000", padding: "3px 8px",
                      borderRadius: "4px", border: "1px solid #38bdf8"
                    }}>
                      {latestSighting.plate}
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar inside Camera */}
                <div style={{
                  position: "absolute", bottom: "8px", right: "8px"
                }}>
                  <button
                    onClick={() => simulateCameraDetection(cam.id)}
                    disabled={isScanning}
                    style={{
                      padding: "4px 10px", borderRadius: "6px", border: "none",
                      background: isScanning ? "#0284c7" : "rgba(255,255,255,0.15)",
                      color: "#fff", fontSize: "0.72rem", fontWeight: "600",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <Play size={10} /> {isScanning ? "Scanning Frame..." : "Inject Scan"}
                  </button>
                </div>
              </div>

              {/* Card Footer Info */}
              <div style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "700", color: "#f8fafc", fontSize: "0.85rem" }}>
                    {cam.name}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: "600" }}>
                    {cam.total_sightings} Sightings
                  </span>
                </div>

                {latestSighting ? (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 8px", background: "rgba(10, 13, 20, 0.7)", borderRadius: "6px"
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Last Pass: <strong style={{ color: "#38bdf8", fontFamily: "monospace" }}>{latestSighting.plate}</strong>
                    </span>
                    <button
                      onClick={() => onSelectPlate(latestSighting.plate)}
                      style={{
                        background: "transparent", border: "none", color: "#38bdf8",
                        fontSize: "0.72rem", cursor: "pointer", textDecoration: "underline"
                      }}
                    >
                      Track
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    No recent sightings logged
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
