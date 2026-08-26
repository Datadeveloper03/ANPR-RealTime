import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Zap, CheckCircle2, Clock } from "lucide-react";
import type { TrajectoryResponse } from "../types";

interface TrajectoryPlayerProps {
  trajectory: TrajectoryResponse | null;
  activePointIndex: number;
  setActivePointIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const TrajectoryPlayer: React.FC<TrajectoryPlayerProps> = ({
  trajectory,
  activePointIndex,
  setActivePointIndex,
  isPlaying,
  setIsPlaying,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const sightings = trajectory?.sightings || [];
  const currentPoint = sightings[activePointIndex] || null;

  // Auto-step animation loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && sightings.length > 1) {
      interval = setInterval(() => {
        setActivePointIndex((prev: number) => {
          if (prev >= sightings.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sightings.length, playbackSpeed, setActivePointIndex, setIsPlaying]);

  if (!trajectory || sightings.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel" style={{ padding: "16px", marginTop: "12px" }}>
      
      {/* Header Info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "4px 10px", borderRadius: "6px",
            background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)",
            fontFamily: "monospace", fontWeight: "700", fontSize: "1rem", color: "#38bdf8"
          }}>
            {trajectory.plate}
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              Total Checkpoints: <strong style={{ color: "#f8fafc" }}>{trajectory.total_sightings}</strong>
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {trajectory.is_blacklisted ? (
            <span style={{
              padding: "4px 10px", borderRadius: "6px",
              background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171", fontSize: "0.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px"
            }}>
              <AlertTriangle size={14} /> BLACKLISTED VEHICLE
            </span>
          ) : (
            <span style={{
              padding: "4px 10px", borderRadius: "6px",
              background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399", fontSize: "0.75rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px"
            }}>
              <ShieldCheck size={14} /> AUTHORIZED VEHICLE
            </span>
          )}

          {trajectory.has_anomalies && (
            <span style={{
              padding: "4px 10px", borderRadius: "6px",
              background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#fbbf24", fontSize: "0.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px"
            }}>
              <Zap size={14} /> ANOMALY DETECTED
            </span>
          )}
        </div>
      </div>

      {/* Blacklist / Anomaly Alert Banner if present */}
      {trajectory.is_blacklisted && trajectory.blacklist_reason && (
        <div style={{
          padding: "10px 14px", borderRadius: "8px", marginBottom: "12px",
          background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#fca5a5", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px"
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span><strong>Blacklist Notice:</strong> {trajectory.blacklist_reason}</span>
        </div>
      )}

      {trajectory.has_anomalies && (
        <div style={{
          padding: "10px 14px", borderRadius: "8px", marginBottom: "12px",
          background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fcd34d", fontSize: "0.82rem"
        }}>
          <div style={{ fontWeight: "700", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Zap size={15} color="#f59e0b" /> Route & Physical Rule Violations:
          </div>
          <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.78rem" }}>
            {trajectory.anomalies.map((anom, idx) => (
              <li key={idx}>{anom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Playback Controls & Progress Bar */}
      <div style={{
        background: "rgba(10, 13, 20, 0.7)", padding: "12px",
        borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)",
        marginBottom: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                if (activePointIndex >= sightings.length - 1) {
                  setActivePointIndex(0);
                }
                setIsPlaying(!isPlaying);
              }}
              style={{
                width: "36px", height: "36px", borderRadius: "8px", border: "none",
                background: "#0284c7", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setActivePointIndex(0);
              }}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.05)", color: "#94a3b8", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              style={{
                padding: "6px 10px", borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.05)", color: "#38bdf8", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: "700"
              }}
            >
              {playbackSpeed}x SPEED
            </button>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontFamily: "monospace" }}>
            Step <strong style={{ color: "#f8fafc" }}>{activePointIndex + 1}</strong> of {sightings.length}
          </div>
        </div>

        {/* Step Slider */}
        <input
          type="range"
          min={0}
          max={sightings.length - 1}
          value={activePointIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setActivePointIndex(parseInt(e.target.value, 10));
          }}
          style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
        />
      </div>

      {/* Checkpoint Detail Card */}
      {currentPoint && (
        <div style={{
          padding: "12px", borderRadius: "8px",
          background: currentPoint.is_anomaly ? "rgba(245, 158, 11, 0.1)" : "rgba(56, 189, 248, 0.06)",
          border: `1px solid ${currentPoint.is_anomaly ? "rgba(245, 158, 11, 0.3)" : "rgba(56, 189, 248, 0.2)"}`
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ fontWeight: "700", color: "#f8fafc", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} color={currentPoint.is_anomaly ? "#f59e0b" : "#38bdf8"} />
              {currentPoint.camera_name} (Cam #{currentPoint.camera_id})
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={13} /> {new Date(currentPoint.timestamp).toLocaleString()}
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.78rem", color: "#94a3b8" }}>
            <div>Confidence: <strong style={{ color: "#34d399" }}>{(currentPoint.confidence * 100).toFixed(1)}%</strong></div>
            {currentPoint.distance_from_prev_km !== null && (
              <div>Dist from prev: <strong style={{ color: "#f8fafc" }}>{currentPoint.distance_from_prev_km} km</strong></div>
            )}
            {currentPoint.time_delta_seconds !== null && (
              <div>Time delta: <strong style={{ color: "#f8fafc" }}>{currentPoint.time_delta_seconds}s</strong></div>
            )}
            {currentPoint.speed_from_prev_kmh !== null && (
              <div>
                Computed Speed:{" "}
                <strong style={{ color: currentPoint.is_anomaly ? "#ef4444" : "#38bdf8" }}>
                  {currentPoint.speed_from_prev_kmh} km/h
                </strong>
              </div>
            )}
          </div>

          {currentPoint.is_anomaly && currentPoint.anomaly_reason && (
            <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#f87171", fontWeight: "600" }}>
              ⚠️ {currentPoint.anomaly_reason}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
