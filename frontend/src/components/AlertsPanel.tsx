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
        return { label: "Wanted", severity: "danger", icon: AlertTriangle };
      case "DUPLICATE_PLATE":
        return { label: "Cloned", severity: "danger", icon: Copy };
      case "APPEARANCE_MISMATCH":
        return { label: "Mismatch", severity: "warning", icon: Car };
      case "GEOFENCE_VIOLATION":
        return { label: "Geofence", severity: "danger", icon: ShieldAlert };
      case "ILLEGAL_UTURN":
        return { label: "U-turn", severity: "warning", icon: RotateCcw };
      case "ILLEGAL_PARKING":
        return { label: "Parking", severity: "warning", icon: SquareParking };
      case "SPEED_ANOMALY":
      default:
        return { label: "Speed", severity: "warning", icon: Zap };
    }
  };

  const severityStyles = {
    danger: { bg: "var(--danger-soft)", color: "var(--danger)", border: "rgba(239, 68, 68, 0.2)" },
    warning: { bg: "var(--warning-soft)", color: "var(--warning)", border: "rgba(245, 158, 11, 0.2)" },
  };

  return (
    <div className="surface" style={{ padding: "var(--space-6)", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>Alerts</h3>
          {alerts.filter(a => a.alert_type !== "SYSTEM_CONNECTED").length > 0 && (
            <div
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                background: "var(--danger-soft)",
                color: "var(--danger)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontWeight: 600,
              }}
            >
              {alerts.filter(a => a.alert_type !== "SYSTEM_CONNECTED").length}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              width: "28px",
              height: "28px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: soundEnabled ? "var(--text-secondary)" : "var(--text-quaternary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {soundEnabled ? <Volume2 size={13} strokeWidth={2} /> : <VolumeX size={13} strokeWidth={2} />}
          </button>
          <button
            onClick={onClearAlerts}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-tertiary)",
              fontWeight: 500,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
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
              padding: "4px 10px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              fontSize: "11px",
              fontWeight: 500,
              background: filterType === f.key ? "var(--accent)" : "var(--bg-elevated)",
              color: filterType === f.key ? "#ffffff" : "var(--text-tertiary)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {filteredAlerts.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-16) var(--space-4)",
              color: "var(--text-quaternary)",
              textAlign: "center",
              gap: "var(--space-3)",
            }}
          >
            <Radio size={28} strokeWidth={1.5} />
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Listening for alerts</div>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isSys = alert.alert_type === "SYSTEM_CONNECTED";

            if (isSys) {
              return (
                <div
                  key={idx}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--accent-soft)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    fontSize: "11px",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Radio size={11} strokeWidth={2} /> {alert.message}
                </div>
              );
            }

            const badge = getAnomalyBadge(alert.alert_type);
            const BadgeIcon = badge.icon;
            const styles = severityStyles[badge.severity as keyof typeof severityStyles];

            return (
              <div
                key={idx}
                style={{
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-xl)",
                  background: styles.bg,
                  border: `1px solid ${styles.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "var(--radius-md)",
                        background: styles.bg,
                        border: `1px solid ${styles.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <BadgeIcon size={12} color={styles.color} strokeWidth={2} />
                    </div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      {alert.plate}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: styles.bg,
                        color: styles.color,
                        border: `1px solid ${styles.border}`,
                        fontWeight: 600,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {alert.plate && (
                    <button
                      onClick={() => onSelectPlate(alert.plate!)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        borderRadius: "var(--radius-lg)",
                        background: "var(--accent)",
                        color: "#fff",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      <Navigation size={10} strokeWidth={2} /> Trace
                    </button>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {alert.reason}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    gap: "var(--space-2)",
                  }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {alert.place_name ? `${alert.place_name} • ${alert.camera_name}` : (alert.camera_name || `Camera ${alert.camera_id}`)}
                  </span>
                  <time
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={10} strokeWidth={2} /> {new Date(alert.timestamp).toLocaleTimeString()}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
