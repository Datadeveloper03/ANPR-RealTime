import React from "react";
import { AlertTriangle, Zap, Radio, Volume2, VolumeX, Navigation, Clock, ShieldAlert } from "lucide-react";
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
  return (
    <div className="glass-panel" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
      
      {/* Panel Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
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

      {/* Alerts List */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {alerts.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "30px 10px", color: "#64748b", textAlign: "center", gap: "8px"
          }}>
            <Radio size={28} color="#334155" />
            <div style={{ fontSize: "0.82rem" }}>Listening to live ANPR camera telemetry...</div>
            <div style={{ fontSize: "0.72rem", color: "#475569" }}>Blacklist hits and speed anomalies will appear here in real time.</div>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isBlacklist = alert.alert_type === "BLACKLIST_HIT";
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

            return (
              <div
                key={idx}
                style={{
                  padding: "10px", borderRadius: "8px",
                  background: isBlacklist ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
                  border: `1px solid ${isBlacklist ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.35)"}`,
                  boxShadow: isBlacklist ? "0 0 10px rgba(239, 68, 68, 0.15)" : "none",
                  display: "flex", flexDirection: "column", gap: "4px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isBlacklist ? (
                      <AlertTriangle size={14} color="#ef4444" />
                    ) : (
                      <Zap size={14} color="#f59e0b" />
                    )}
                    <span style={{
                      fontFamily: "monospace", fontWeight: "700", fontSize: "0.85rem",
                      color: isBlacklist ? "#fca5a5" : "#fcd34d"
                    }}>
                      {alert.plate}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", padding: "1px 5px", borderRadius: "4px",
                      background: isBlacklist ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.25)",
                      color: isBlacklist ? "#f87171" : "#fbbf24", fontWeight: "700"
                    }}>
                      {isBlacklist ? "WANTED" : "ANOMALY"}
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

                <div style={{ fontSize: "0.75rem", color: "#e2e8f0" }}>
                  {alert.reason}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                  <span>{alert.camera_name || `Cam #${alert.camera_id}`}</span>
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
