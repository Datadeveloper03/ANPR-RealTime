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
        return { label: "Cloned plate", severity: "danger", icon: Copy };
      case "APPEARANCE_MISMATCH":
        return { label: "Mismatch", severity: "warning", icon: Car };
      case "GEOFENCE_VIOLATION":
        return { label: "Geofence breach", severity: "danger", icon: ShieldAlert };
      case "ILLEGAL_UTURN":
        return { label: "U-turn", severity: "warning", icon: RotateCcw };
      case "ILLEGAL_PARKING":
        return { label: "No parking", severity: "warning", icon: SquareParking };
      case "SPEED_ANOMALY":
      default:
        return { label: "Speed anomaly", severity: "warning", icon: Zap };
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: "var(--space-4)",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>

      {/* Panel Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--space-3)",
        paddingBottom: "var(--space-3)",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <ShieldAlert size={16} color="var(--text-tertiary)" strokeWidth={2} />
          <h3 style={{
            fontSize: "var(--font-size-md)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)"
          }}>
            Alerts
          </h3>
          {alerts.filter(a => a.alert_type !== "SYSTEM_CONNECTED").length > 0 && (
            <span style={{
              fontSize: "var(--font-size-xs)",
              padding: "2px var(--space-2)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-danger-soft)",
              color: "var(--color-danger)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              fontWeight: "var(--font-weight-medium)"
            }}>
              {alerts.filter(a => a.alert_type !== "SYSTEM_CONNECTED").length}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute alert chime" : "Enable alert chime"}
            style={{
              width: "28px",
              height: "28px",
              background: "transparent",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: soundEnabled ? "var(--text-secondary)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {soundEnabled ? <Volume2 size={14} strokeWidth={2} /> : <VolumeX size={14} strokeWidth={2} />}
          </button>
          <button
            onClick={onClearAlerts}
            style={{
              padding: "var(--space-1) var(--space-3)",
              fontSize: "var(--font-size-xs)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              color: "var(--text-tertiary)",
              fontWeight: "var(--font-weight-medium)"
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick Filter Bar */}
      <div style={{
        display: "flex",
        gap: "var(--space-1)",
        flexWrap: "wrap",
        marginBottom: "var(--space-4)"
      }}>
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
              padding: "var(--space-1) var(--space-2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-medium)",
              background: filterType === f.key ? "var(--color-primary)" : "var(--bg-secondary)",
              color: filterType === f.key ? "#ffffff" : "var(--text-tertiary)",
              transition: "var(--transition-base)"
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)"
      }}>
        {filteredAlerts.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-10) var(--space-4)",
            color: "var(--text-muted)",
            textAlign: "center",
            gap: "var(--space-3)"
          }}>
            <Radio size={28} color="var(--text-disabled)" strokeWidth={2} />
            <div style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-tertiary)"
            }}>
              Listening for alerts...
            </div>
            <div style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-muted)",
              maxWidth: "240px"
            }}>
              Security events and blacklist hits will appear here in real time
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isSys = alert.alert_type === "SYSTEM_CONNECTED";

            if (isSys) {
              return (
                <div key={idx} style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-info-soft)",
                  border: "1px solid rgba(99, 179, 237, 0.2)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-info)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)"
                }}>
                  <Radio size={12} strokeWidth={2} /> {alert.message}
                </div>
              );
            }

            const badge = getAnomalyBadge(alert.alert_type);
            const BadgeIcon = badge.icon;

            const severityColors = {
              danger: {
                bg: "var(--color-danger-soft)",
                border: "rgba(239, 68, 68, 0.2)",
                color: "var(--color-danger)"
              },
              warning: {
                bg: "var(--color-warning-soft)",
                border: "rgba(245, 158, 11, 0.2)",
                color: "var(--color-warning)"
              }
            };

            const colors = severityColors[badge.severity as keyof typeof severityColors];

            return (
              <div
                key={idx}
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-lg)",
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-2)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    flex: 1,
                    minWidth: 0
                  }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "var(--radius-md)",
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <BadgeIcon size={12} color={colors.color} strokeWidth={2} />
                    </div>
                    <span style={{
                      fontFamily: "monospace",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "var(--font-size-base)",
                      color: "var(--text-primary)"
                    }}>
                      {alert.plate}
                    </span>
                    <span style={{
                      fontSize: "var(--font-size-xs)",
                      padding: "2px var(--space-2)",
                      borderRadius: "var(--radius-sm)",
                      background: colors.bg,
                      color: colors.color,
                      border: `1px solid ${colors.border}`,
                      fontWeight: "var(--font-weight-medium)"
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  {alert.plate && (
                    <button
                      onClick={() => onSelectPlate(alert.plate!)}
                      style={{
                        padding: "var(--space-1) var(--space-2)",
                        fontSize: "var(--font-size-xs)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-primary)",
                        color: "#fff",
                        fontWeight: "var(--font-weight-medium)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-1)",
                        flexShrink: 0
                      }}
                    >
                      <Navigation size={10} strokeWidth={2} /> Trace
                    </button>
                  )}
                </div>

                <div style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--text-secondary)",
                  lineHeight: "var(--line-height-base)"
                }}>
                  {alert.reason}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-tertiary)",
                  gap: "var(--space-2)"
                }}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {alert.place_name ? `${alert.place_name} • ${alert.camera_name}` : (alert.camera_name || `Camera ${alert.camera_id}`)}
                  </span>
                  <time style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    flexShrink: 0
                  }}>
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
