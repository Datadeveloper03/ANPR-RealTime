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

  const profile = trajectory.registered_profile;

  return (
    <div className="glass-panel" style={{ padding: "var(--space-4)", marginTop: "var(--space-3)" }}>

      {/* Header Info */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "var(--space-3)",
        marginBottom: "var(--space-4)",
        paddingBottom: "var(--space-3)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div style={{
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            fontFamily: "monospace",
            fontWeight: "var(--font-weight-semibold)",
            fontSize: "var(--font-size-lg)",
            color: "var(--text-primary)"
          }}>
            {trajectory.plate}
          </div>

          {profile && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "var(--font-size-sm)",
              color: "var(--text-secondary)"
            }}>
              <Car size={13} color="var(--text-tertiary)" strokeWidth={2} />
              <span>{profile.registered_color} {profile.registered_type} • {profile.make}</span>
            </div>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--font-size-sm)",
            color: "var(--text-tertiary)"
          }}>
            <Navigation2 size={12} strokeWidth={2} />
            <span>{trajectory.total_sightings} checkpoints</span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {trajectory.is_blacklisted ? (
            <span className="badge-danger" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <AlertTriangle size={12} strokeWidth={2} /> Blacklisted
            </span>
          ) : trajectory.has_anomalies ? (
            <span className="badge-warning" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Zap size={12} strokeWidth={2} /> Anomaly detected
            </span>
          ) : (
            <span className="badge-success" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <ShieldCheck size={12} strokeWidth={2} /> Clean route
            </span>
          )}
        </div>
      </div>

      {/* Blacklist / Anomaly Alert Banner */}
      {trajectory.is_blacklisted && trajectory.blacklist_reason && (
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-4)",
          background: "var(--color-danger-soft)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "var(--color-danger)",
          fontSize: "var(--font-size-sm)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)"
        }}>
          <AlertTriangle size={16} strokeWidth={2} />
          <span><strong>Blacklist notice:</strong> {trajectory.blacklist_reason}</span>
        </div>
      )}

      {trajectory.has_anomalies && (
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-4)",
          background: "var(--color-warning-soft)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          fontSize: "var(--font-size-sm)"
        }}>
          <div style={{
            fontWeight: "var(--font-weight-semibold)",
            marginBottom: "var(--space-2)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            color: "var(--color-warning)"
          }}>
            <Zap size={14} strokeWidth={2} /> Detected violations
          </div>
          <ul style={{
            paddingLeft: "var(--space-5)",
            margin: 0,
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)"
          }}>
            {trajectory.anomalies.map((anom, idx) => (
              <li key={idx}>{anom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Playback Controls & Progress Bar */}
      <div style={{
        background: "var(--bg-secondary)",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-default)",
        marginBottom: "var(--space-4)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-3)"
        }}>
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
                background: "var(--color-primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isPlaying ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
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
                border: "1px solid var(--border-default)",
                background: "var(--bg-tertiary)",
                color: "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <RotateCcw size={14} strokeWidth={2} />
            </button>
            <button
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-weight-medium)"
              }}
            >
              {playbackSpeed}× speed
            </button>
          </div>

          <div style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-tertiary)",
            fontFamily: "monospace",
            fontWeight: "var(--font-weight-medium)"
          }}>
            <span style={{ color: "var(--text-primary)" }}>{activePointIndex + 1}</span> / {sightings.length}
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
          style={{ width: "100%", accentColor: "var(--color-primary)", cursor: "pointer", height: "4px" }}
        />
      </div>

      {/* Checkpoint Detail Card */}
      {currentPoint && (
        <div style={{
          padding: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
          background: currentPoint.is_anomaly ? "var(--color-warning-soft)" : "var(--color-info-soft)",
          border: `1px solid ${currentPoint.is_anomaly ? "rgba(245, 158, 11, 0.2)" : "rgba(99, 179, 237, 0.2)"}`
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
            flexWrap: "wrap",
            gap: "var(--space-2)"
          }}>
            <div style={{
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--text-primary)",
              fontSize: "var(--font-size-base)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)"
            }}>
              <CheckCircle2 size={14} color={currentPoint.is_anomaly ? "var(--color-warning)" : "var(--color-info)"} strokeWidth={2} />
              {currentPoint.camera_name}
              {currentPoint.place_name && <span style={{ color: "var(--text-tertiary)" }}>• {currentPoint.place_name}</span>}
            </div>
            <time style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)"
            }}>
              <Clock size={12} strokeWidth={2} /> {new Date(currentPoint.timestamp).toLocaleString()}
            </time>
          </div>

          <div style={{
            display: "flex",
            gap: "var(--space-4)",
            flexWrap: "wrap",
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)"
          }}>
            <div>{currentPoint.vehicle_color} {currentPoint.vehicle_type} • {currentPoint.make}</div>
            <div>Confidence: {(currentPoint.confidence * 100).toFixed(1)}%</div>
            {currentPoint.distance_from_prev_km !== null && (
              <div>{currentPoint.distance_from_prev_km} km</div>
            )}
            {currentPoint.time_delta_seconds !== null && (
              <div>{currentPoint.time_delta_seconds}s</div>
            )}
            {currentPoint.speed_from_prev_kmh !== null && (
              <div style={{ color: currentPoint.is_anomaly ? "var(--color-danger)" : "var(--text-secondary)" }}>
                {currentPoint.speed_from_prev_kmh} km/h
              </div>
            )}
          </div>

          {currentPoint.is_anomaly && currentPoint.anomaly_reason && (
            <div style={{
              marginTop: "var(--space-3)",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid rgba(245, 158, 11, 0.2)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-warning)",
              fontWeight: "var(--font-weight-medium)"
            }}>
              {currentPoint.anomaly_reason}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
