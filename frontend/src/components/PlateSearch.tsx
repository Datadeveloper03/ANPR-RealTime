import React, { useState } from "react";
import { Search, ShieldCheck, Car, Copy, ShieldAlert, RotateCcw, SquareParking, AlertTriangle, Zap } from "lucide-react";

interface PlateSearchProps {
  onSearch: (plate: string) => void;
  isLoading: boolean;
  activePlate: string;
}

export const PlateSearch: React.FC<PlateSearchProps> = ({ onSearch, isLoading, activePlate }) => {
  const [searchInput, setSearchInput] = useState(activePlate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const scenarios = [
    {
      plate: "DL01AB1234",
      label: "Clean route",
      severity: "success",
      desc: "Normal trajectory across city",
      icon: ShieldCheck,
    },
    {
      plate: "TN09BZ9999",
      label: "Vehicle mismatch",
      severity: "warning",
      desc: "Registered sedan, detected truck",
      icon: Car,
    },
    {
      plate: "KA01MJ1122",
      label: "Clone detected",
      severity: "danger",
      desc: "Simultaneous sightings 10km apart",
      icon: Copy,
    },
    {
      plate: "KA04EK9081",
      label: "Geofence breach",
      severity: "danger",
      desc: "Unauthorized zone entry",
      icon: ShieldAlert,
    },
    {
      plate: "TS07AB4040",
      label: "Illegal U-turn",
      severity: "warning",
      desc: "Prohibited maneuver detected",
      icon: RotateCcw,
    },
    {
      plate: "DL08CD5566",
      label: "Parking violation",
      severity: "warning",
      desc: "9min dwell in no-parking zone",
      icon: SquareParking,
    },
    {
      plate: "MH12DE1433",
      label: "Wanted vehicle",
      severity: "danger",
      desc: "Stolen vehicle, red notice",
      icon: AlertTriangle,
    },
    {
      plate: "KA05MB4567",
      label: "Speed anomaly",
      severity: "warning",
      desc: "390+ km/h computed speed",
      icon: Zap,
    },
  ];

  const severityStyles = {
    success: { bg: "var(--success-soft)", color: "var(--success)", border: "rgba(34, 197, 94, 0.2)" },
    warning: { bg: "var(--warning-soft)", color: "var(--warning)", border: "rgba(245, 158, 11, 0.2)" },
    danger: { bg: "var(--danger-soft)", color: "var(--danger)", border: "rgba(239, 68, 68, 0.2)" },
  };

  return (
    <div className="surface" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: "var(--space-2)",
          }}
        >
          Vehicle search
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            letterSpacing: "-0.01em",
          }}
        >
          Search by license plate to reconstruct road trajectory
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "var(--space-8)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            placeholder="Enter plate number (e.g. DL01AB1234)"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "var(--radius-xl)",
              fontFamily: "monospace",
              fontSize: "14px",
              letterSpacing: "0.02em",
              fontWeight: 500,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: (isLoading || !searchInput.trim()) ? 0.5 : 1,
            }}
          >
            <Search size={14} strokeWidth={2} />
            {isLoading ? "Tracing..." : "Search"}
          </button>
        </div>
      </form>

      {/* Scenarios */}
      <div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-quaternary)",
            marginBottom: "var(--space-4)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 500,
          }}
        >
          Test scenarios
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {scenarios.map((scenario) => {
            const isActive = activePlate === scenario.plate;
            const Icon = scenario.icon;
            const styles = severityStyles[scenario.severity as keyof typeof severityStyles];

            return (
              <button
                key={scenario.plate}
                onClick={() => {
                  setSearchInput(scenario.plate);
                  onSearch(scenario.plate);
                }}
                style={{
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-xl)",
                  background: isActive ? "var(--bg-surface)" : "var(--bg-elevated)",
                  border: `1px solid ${isActive ? "var(--border-hover)" : "var(--border)"}`,
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      background: styles.bg,
                      border: `1px solid ${styles.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color={styles.color} strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        fontWeight: 600,
                        marginBottom: "4px",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {scenario.plate}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                        marginBottom: "2px",
                      }}
                    >
                      {scenario.label}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-tertiary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {scenario.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
