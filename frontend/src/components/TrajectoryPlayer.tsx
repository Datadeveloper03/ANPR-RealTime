import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Zap, CheckCircle2, Clock, Car, Navigation2 } from "lucide-react";
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

  const profile = trajectory.registered_profile;

  return (
    <div className="surface" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-6)",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--border)",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              fontFamily: "monospace",
              fontWeight: 600,
              fontSize: "15px",
              letterSpacing: "0.02em",
            }}
          >
            {trajectory.plate}
          </div>

          {profile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              <Car size={13} strokeWidth={2} />
              <span>{profile.registered_color} {profile.registered_type} • {profile.make}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "var(--text-tertiary)",
            }}
          >
            <Navigation2 size={12} strokeWidth={2} />
            <span>{trajectory.total_sightings} checkpoints</span>
          </div>
        </div>

        {/* Status badge */}
        <div>
          {trajectory.is_blacklisted ? (
            <div className="badge-danger">
              <AlertTriangle size={11} strokeWidth={2.5} /> Blacklisted
            </div>
          ) : trajectory.has_anomalies ? (
            <div className="badge-warning">
              <Zap size={11} strokeWidth={2.5} /> Anomaly
            </div>
          ) : (
            <div className="badge-success">
              <ShieldCheck size={11} strokeWidth={2.5} /> Clean
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {trajectory.is_blacklisted && trajectory.blacklist_reason && (
        <div
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-xl)",
            marginBottom: "var(--space-6)",
            background: "var(--danger-soft)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <AlertTriangle size={16} color="var(--danger)" strokeWidth={2} />
          <span style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--danger)" }}>Blacklist:</strong> {trajectory.blacklist_reason}
          </span>
        </div>
      )}

      {trajectory.has_anomalies && (
        <div
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-xl)",
            marginBottom: "var(--space-6)",
            background: "var(--warning-soft)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: "var(--space-2)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--warning)",
              fontSize: "12px",
            }}
          >
            <Zap size={14} strokeWidth={2} /> Detected violations
          </div>
          <ul
            style={{
              paddingLeft: "var(--space-6)",
              margin: 0,
              fontSize: "12px",
              color: "var(--text-secondary)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {trajectory.anomalies.map((anom, idx) => (
              <li key={idx}>{anom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Playback controls */}
      <div
        style={{
          background: "var(--bg-elevated)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <button
              onClick={() => {
                if (activePointIndex >= sightings.length - 1) {
                  setActivePointIndex(0);
                }
                setIsPlaying(!isPlaying);
              }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-lg)",
                background: "var(--accent)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isPlaying ? <Pause size={16} strokeWidth={2.5} /> : <Play size={16} strokeWidth={2.5} />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setActivePointIndex(0);
              }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={14} strokeWidth={2} />
            </button>
            <button
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {playbackSpeed}× speed
            </button>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              fontFamily: "monospace",
              fontWeight: 500,
            }}
          >
            <span style={{ color: "var(--text-primary)" }}>{activePointIndex + 1}</span> / {sightings.length}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={sightings.length - 1}
          value={activePointIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setActivePointIndex(parseInt(e.target.value, 10));
          }}
          style={{
            width: "100%",
            height: "6px",
            accentColor: "var(--accent)",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Current checkpoint */}
      {currentPoint && (
        <div
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-xl)",
            background: currentPoint.is_anomaly ? "var(--warning-soft)" : "var(--accent-soft)",
            border: `1px solid ${currentPoint.is_anomaly ? "rgba(245, 158, 11, 0.2)" : "rgba(59, 130, 246, 0.2)"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-3)",
              gap: "var(--space-3)",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2
                size={14}
                color={currentPoint.is_anomaly ? "var(--warning)" : "var(--accent)"}
                strokeWidth={2}
              />
              {currentPoint.camera_name}
              {currentPoint.place_name && (
                <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>• {currentPoint.place_name}</span>
              )}
            </div>
            <time
              style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Clock size={11} strokeWidth={2} /> {new Date(currentPoint.timestamp).toLocaleString()}
            </time>
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--space-4)",
              flexWrap: "wrap",
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            <div>{currentPoint.vehicle_color} {currentPoint.vehicle_type} • {currentPoint.make}</div>
            <div>{(currentPoint.confidence * 100).toFixed(1)}% confidence</div>
            {currentPoint.distance_from_prev_km !== null && <div>{currentPoint.distance_from_prev_km} km</div>}
            {currentPoint.time_delta_seconds !== null && <div>{currentPoint.time_delta_seconds}s</div>}
            {currentPoint.speed_from_prev_kmh !== null && (
              <div style={{ color: currentPoint.is_anomaly ? "var(--danger)" : "var(--text-secondary)" }}>
                {currentPoint.speed_from_prev_kmh} km/h
              </div>
            )}
          </div>

          {currentPoint.is_anomaly && currentPoint.anomaly_reason && (
            <div
              style={{
                marginTop: "var(--space-3)",
                paddingTop: "var(--space-3)",
                borderTop: "1px solid rgba(245, 158, 11, 0.2)",
                fontSize: "12px",
                color: "var(--warning)",
                fontWeight: 500,
              }}
            >
              {currentPoint.anomaly_reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
