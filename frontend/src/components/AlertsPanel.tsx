import React, { useState } from "react";
import {
  AlertTriangle,
  Zap,
  Radio,
  Volume2,
  VolumeX,
  Navigation,
  Clock,
  ShieldAlert,
  Copy,
  Car,
  RotateCcw,
  SquareParking,
} from "lucide-react";
import type { AlertMessage } from "../types";

interface AlertsPanelProps {
  alerts: AlertMessage[];
  onSelectPlate: (plate: string) => void;
  onClearAlerts: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onSelectPlate,
  onClearAlerts,
  soundEnabled,
  setSoundEnabled,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === "ALL") return true;
    if (a.alert_type === "SYSTEM_CONNECTED") return true;
    return a.alert_type === filterType;
  });

  const getAnomalyBadge = (type: string) => {
    switch (type) {
      case "BLACKLIST_HIT":
        return { label: "WANTED", color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)", icon: AlertTriangle };
      case "DUPLICATE_PLATE":
        return { label: "CLONED PLATE", color: "#ef4444", bg: "rgba(239, 68, 68, 0.25)", icon: Copy };
      case "APPEARANCE_MISMATCH":
        return { label: "MISMATCH", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.25)", icon: Car };
      case "GEOFENCE_VIOLATION":
        return { label: "GEOFENCE BREACH", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.25)", icon: ShieldAlert };
      case "ILLEGAL_UTURN":
        return { label: "U-TURN VIOLATION", color: "#a855f7", bg: "rgba(168, 85, 247, 0.25)", icon: RotateCcw };
      case "ILLEGAL_PARKING":
        return { label: "NO PARKING", color: "#eab308", bg: "rgba(234, 179, 8, 0.25)", icon: SquareParking };
      case "SPEED_ANOMALY":
      default:
        return { label: "SPEED ANOMALY", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.25)", icon: Zap };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
      
      {/* Panel Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ position: "relative" }}>
            <ShieldAlert size={18} color="#ef4444" />
            <span className="radar-pulse-red" style={{ position: "absolute", top: 0, left: 0, width: "18px", height: "18px", borderRadius: "50%" }}></span>
          </div>
          <h3 style={{ fontSize: "0.92rem", fontWeight: "700", letterSpacing: "0.5px" }}>
            LIVE INTERCEPT ALERTS
          </h3>
          <span style={{
            fontSize: "0.68rem", padding: "1px 6px", borderRadius: "10px",
            background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontWeight: "700"
          }}>
            {alerts.filter(a => a.alert_type !== "SYSTEM_CONNECTED").length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute alert chime" : "Enable alert chime"}
            style={{
              background: "transparent", border: "none", color: soundEnabled ? "#38bdf8" : "#64748b",
              cursor: "pointer", display: "flex", alignItems: "center"
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={onClearAlerts}
            style={{
              padding: "2px 8px", fontSize: "0.68rem", borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94a3b8", cursor: "pointer"
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick Filter Bar */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
        {[
          { key: "ALL", label: "All" },
          { key: "DUPLICATE_PLATE", label: "Clones" },
          { key: "APPEARANCE_MISMATCH", label: "Mismatch" },
          { key: "GEOFENCE_VIOLATION", label: "Geofence" },
          { key: "ILLEGAL_UTURN", label: "U-Turn" },
          { key: "ILLEGAL_PARKING", label: "Parking" },
          { key: "BLACKLIST_HIT", label: "Wanted" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            style={{
              padding: "2px 6px", borderRadius: "4px", border: "none",
              fontSize: "0.65rem", fontWeight: "600", cursor: "pointer",
              background: filterType === f.key ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.05)",
              color: filterType === f.key ? "#38bdf8" : "#94a3b8"
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredAlerts.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "30px 10px", color: "#64748b", textAlign: "center", gap: "8px"
          }}>
            <Radio size={28} color="#334155" />
            <div style={{ fontSize: "0.82rem" }}>Listening to live ANPR surveillance stream...</div>
            <div style={{ fontSize: "0.72rem", color: "#475569" }}>Multi-anomaly security events and blacklist hits will stream here in real time.</div>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isSys = alert.alert_type === "SYSTEM_CONNECTED";

            if (isSys) {
              return (
                <div key={idx} style={{
                  padding: "6px 10px", borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)",
                  fontSize: "0.72rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px"
                }}>
                  <Radio size={12} /> {alert.message}
                </div>
              );
            }

            const badge = getAnomalyBadge(alert.alert_type);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={idx}
                style={{
                  padding: "10px", borderRadius: "8px",
                  background: badge.bg,
                  border: `1px solid ${badge.color}55`,
                  boxShadow: `0 0 10px ${badge.color}22`,
                  display: "flex", flexDirection: "column", gap: "4px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <BadgeIcon size={14} color={badge.color} />
                    <span style={{
                      fontFamily: "monospace", fontWeight: "700", fontSize: "0.85rem",
                      color: "#ffffff"
                    }}>
                      {alert.plate}
                    </span>
                    <span style={{
                      fontSize: "0.62rem", padding: "1px 5px", borderRadius: "4px",
                      background: badge.bg,
                      color: badge.color, fontWeight: "700"
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  {alert.plate && (
                    <button
                      onClick={() => onSelectPlate(alert.plate!)}
                      style={{
                        padding: "2px 6px", fontSize: "0.68rem", borderRadius: "4px",
                        background: "#0284c7", color: "#fff", border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "3px"
                      }}
                    >
                      <Navigation size={10} /> Track
                    </button>
                  )}
                </div>

                <div style={{ fontSize: "0.75rem", color: "#e2e8f0", lineHeight: "1.3" }}>
                  {alert.reason}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                  <span>{alert.place_name ? `${alert.place_name} (${alert.camera_name})` : (alert.camera_name || `Cam #${alert.camera_id}`)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={10} /> {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
