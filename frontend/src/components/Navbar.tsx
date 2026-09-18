import { useState, useEffect } from "react";
import { Shield, Radio, Activity, Car, AlertTriangle, Eye, Video } from "lucide-react";
import type { SystemStats } from "../types";

interface NavbarProps {
  stats: SystemStats | null;
  wsConnected: boolean;
  activeTab: "map" | "cctv" | "blacklist";
  setActiveTab: (tab: "map" | "cctv" | "blacklist") => void;
  onTriggerSimulation: () => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  wsConnected,
  activeTab,
  setActiveTab,
  onTriggerSimulation,
  isSimulating,
}) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="glass-panel" style={{ margin: "var(--space-3) var(--space-4)", padding: "var(--space-3) var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>

        {/* Left: Branding & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "var(--radius-lg)",
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={20} color="#ffffff" strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <h1 style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-semibold)",
                letterSpacing: "-0.01em",
                color: "var(--text-primary)"
              }}>
                ANPR Sentinel
              </h1>
              <span style={{
                fontSize: "var(--font-size-xs)",
                padding: "2px var(--space-2)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-success-soft)",
                color: "var(--color-success)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontWeight: "var(--font-weight-medium)",
                textTransform: "none"
              }}>
                ● System operational
              </span>
            </div>
            <p style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-tertiary)",
              marginTop: "2px",
              fontWeight: "var(--font-weight-normal)"
            }}>
              City-wide vehicle intelligence
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav style={{
          display: "flex",
          background: "var(--bg-secondary)",
          padding: "var(--space-1)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-default)",
          gap: "var(--space-1)"
        }}>
          <button
            onClick={() => setActiveTab("map")}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: activeTab === "map" ? "var(--color-primary)" : "transparent",
              color: activeTab === "map" ? "#ffffff" : "var(--text-tertiary)",
              transition: "var(--transition-base)"
            }}
          >
            <Activity size={14} strokeWidth={2} /> Command Map
          </button>
          <button
            onClick={() => setActiveTab("cctv")}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: activeTab === "cctv" ? "var(--color-primary)" : "transparent",
              color: activeTab === "cctv" ? "#ffffff" : "var(--text-tertiary)",
              transition: "var(--transition-base)"
            }}
          >
            <Video size={14} strokeWidth={2} /> CCTV Network
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: activeTab === "blacklist" ? "var(--color-primary)" : "transparent",
              color: activeTab === "blacklist" ? "#ffffff" : "var(--text-tertiary)",
              transition: "var(--transition-base)"
            }}
          >
            <AlertTriangle size={14} strokeWidth={2} /> Blacklist
            {stats?.blacklisted_vehicles > 0 && (
              <span style={{
                fontSize: "var(--font-size-xs)",
                background: "rgba(255, 255, 255, 0.2)",
                padding: "1px var(--space-1)",
                borderRadius: "var(--radius-sm)",
                fontWeight: "var(--font-weight-semibold)"
              }}>
                {stats.blacklisted_vehicles}
              </span>
            )}
          </button>
        </nav>

        {/* Right: Quick Telemetry & Simulation Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>

          {/* Quick Stats */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
            color: "var(--text-tertiary)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Eye size={14} color="var(--text-tertiary)" strokeWidth={2} />
              <span>{stats?.active_cameras || 6} cameras</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Car size={14} color="var(--text-tertiary)" strokeWidth={2} />
              <span>{stats?.total_sightings || 0} sightings</span>
            </div>
          </div>

          {/* WebSocket Status Indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-1) var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: wsConnected ? "var(--color-success-soft)" : "var(--color-danger-soft)",
            border: `1px solid ${wsConnected ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
            fontSize: "var(--font-size-xs)",
            fontWeight: "var(--font-weight-medium)",
            color: wsConnected ? "var(--color-success)" : "var(--color-danger)"
          }}>
            <Radio size={10} className={wsConnected ? "radar-pulse" : ""} strokeWidth={2} />
            <span>{wsConnected ? "Live" : "Connecting"}</span>
          </div>

          {/* Simulation Trigger Button */}
          <button
            onClick={onTriggerSimulation}
            disabled={isSimulating}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              background: isSimulating ? "var(--bg-tertiary)" : "var(--color-primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              opacity: isSimulating ? 0.6 : 1
            }}
          >
            <Activity size={14} strokeWidth={2} />
            {isSimulating ? "Simulating..." : "Test feed"}
          </button>

          {/* Live Clock */}
          <time style={{
            fontFamily: "monospace",
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)",
            padding: "var(--space-1) var(--space-3)",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            fontWeight: "var(--font-weight-medium)"
          }}>
            {time}
          </time>

        </div>

      </div>
    </header>
  );
};
