import React, { useState } from "react";
import { Search, AlertTriangle, ShieldCheck, Zap, Copy, Car, ShieldAlert, RotateCcw, SquareParking } from "lucide-react";

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

  const demoScenarios = [
    {
      plate: "DL01AB1234",
      label: "Clean Multi-Point Road Route",
      severity: "success",
      desc: "MG Rd → Indiranagar → Domlur → Koramangala",
      icon: ShieldCheck,
    },
    {
      plate: "TN09BZ9999",
      label: "Vehicle Appearance Mismatch",
      severity: "warning",
      desc: "Registered: Red Sedan • Detected: White Truck",
      icon: Car,
    },
    {
      plate: "KA01MJ1122",
      label: "Cloned / Duplicate Plate",
      severity: "danger",
      desc: "Simultaneous sightings 10.7km apart in 12s",
      icon: Copy,
    },
    {
      plate: "KA04EK9081",
      label: "Geofence Zone Violation",
      severity: "danger",
      desc: "Unauthorized entry into Koramangala restricted zone",
      icon: ShieldAlert,
    },
    {
      plate: "TS07AB4040",
      label: "Prohibited U-Turn",
      severity: "warning",
      desc: "Corridor reversal at MG Road intersection",
      icon: RotateCcw,
    },
    {
      plate: "DL08CD5566",
      label: "Illegal Parking / Dwell",
      severity: "warning",
      desc: "9 minute dwell in Indiranagar no-parking zone",
      icon: SquareParking,
    },
    {
      plate: "MH12DE1433",
      label: "Blacklisted Vehicle",
      severity: "danger",
      desc: "Wanted • Stolen vehicle • Red notice #9921",
      icon: AlertTriangle,
    },
    {
      plate: "KA05MB4567",
      label: "Extreme Speed Anomaly",
      severity: "warning",
      desc: "390+ km/h computed speed (13km in 2 minutes)",
      icon: Zap,
    },
  ];

  return (
    <div className="glass-panel" style={{ padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <h3 style={{
          fontSize: "var(--font-size-md)",
          fontWeight: "var(--font-weight-semibold)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          color: "var(--text-primary)"
        }}>
          <Search size={16} color="var(--text-tertiary)" strokeWidth={2} />
          Vehicle Search
        </h3>
        <span style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-muted)",
          fontFamily: "monospace"
        }}>
          Format: <code style={{
            color: "var(--text-tertiary)",
            background: "var(--bg-secondary)",
            padding: "2px var(--space-2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)"
          }}>DL01AB1234</code>
        </span>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            placeholder="Enter license plate (e.g. DL01AB1234)..."
            style={{
              width: "100%",
              padding: "var(--space-3) var(--space-4)",
              background: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-primary)",
              fontSize: "var(--font-size-base)",
              fontFamily: "monospace",
              letterSpacing: "0.02em"
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !searchInput.trim()}
          style={{
            padding: "var(--space-3) var(--space-5)",
            background: "var(--color-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius-lg)",
            fontSize: "var(--font-size-sm)",
            fontWeight: "var(--font-weight-medium)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            whiteSpace: "nowrap",
            opacity: (isLoading || !searchInput.trim()) ? 0.6 : 1
          }}
        >
          <Search size={16} strokeWidth={2} />
          {isLoading ? "Tracing..." : "Trace vehicle"}
        </button>
      </form>

      {/* Demo Scenarios */}
      <div>
        <div style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-muted)",
          marginBottom: "var(--space-3)",
          fontWeight: "var(--font-weight-medium)",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          Test scenarios
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-2)" }}>
          {demoScenarios.map((demo) => {
            const isSelected = activePlate === demo.plate;
            const Icon = demo.icon;

            const severityColors = {
              success: { bg: "var(--color-success-soft)", border: "rgba(16, 185, 129, 0.2)", icon: "var(--color-success)" },
              warning: { bg: "var(--color-warning-soft)", border: "rgba(245, 158, 11, 0.2)", icon: "var(--color-warning)" },
              danger: { bg: "var(--color-danger-soft)", border: "rgba(239, 68, 68, 0.2)", icon: "var(--color-danger)" },
            };

            const colors = severityColors[demo.severity as keyof typeof severityColors];

            return (
              <button
                key={demo.plate}
                onClick={() => {
                  setSearchInput(demo.plate);
                  onSearch(demo.plate);
                }}
                style={{
                  padding: "var(--space-3)",
                  background: isSelected ? "var(--bg-card-hover)" : "var(--bg-secondary)",
                  border: `1px solid ${isSelected ? "var(--border-active)" : "var(--border-default)"}`,
                  borderRadius: "var(--radius-lg)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "var(--transition-base)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-md)",
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Icon size={14} color={colors.icon} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "monospace",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--text-primary)",
                      fontSize: "var(--font-size-sm)",
                      marginBottom: "2px"
                    }}>
                      {demo.plate}
                    </div>
                    <div style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--text-secondary)",
                      fontWeight: "var(--font-weight-medium)",
                      marginBottom: "var(--space-1)"
                    }}>
                      {demo.label}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-tertiary)",
                  lineHeight: "var(--line-height-base)"
                }}>
                  {demo.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
