import { useState, useEffect } from "react";
import { Shield, Activity, Video, AlertTriangle, Eye, Car, Radio } from "lucide-react";
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
    <header
      style={{
        padding: "var(--space-6) var(--space-8)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          maxWidth: "1800px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-12)",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={18} strokeWidth={2.5} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              ANPR Sentinel
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-tertiary)",
                marginTop: "4px",
                letterSpacing: "-0.01em",
              }}
            >
              City intelligence
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "var(--bg-elevated)",
            padding: "4px",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setActiveTab("map")}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-lg)",
              background: activeTab === "map" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "map" ? "var(--text-primary)" : "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <Activity size={14} strokeWidth={2} />
            Map
          </button>
          <button
            onClick={() => setActiveTab("cctv")}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-lg)",
              background: activeTab === "cctv" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "cctv" ? "var(--text-primary)" : "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <Video size={14} strokeWidth={2} />
            Cameras
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-lg)",
              background: activeTab === "blacklist" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "blacklist" ? "var(--text-primary)" : "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={14} strokeWidth={2} />
            Blacklist
            {(stats?.blacklisted_vehicles ?? 0) > 0 && (
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                {stats?.blacklisted_vehicles}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
          {/* Stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-6)",
              fontSize: "12px",
              color: "var(--text-tertiary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Eye size={13} strokeWidth={2} />
              <span>{stats?.active_cameras || 6}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Car size={13} strokeWidth={2} />
              <span>{stats?.total_sightings || 0}</span>
            </div>
          </div>

          {/* Status */}
          <div
            className={wsConnected ? "badge-success" : "badge-danger"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Radio size={10} strokeWidth={2.5} className={wsConnected ? "pulse" : ""} />
            <span>{wsConnected ? "Live" : "Connecting"}</span>
          </div>

          {/* Actions */}
          <button
            onClick={onTriggerSimulation}
            disabled={isSimulating}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              opacity: isSimulating ? 0.6 : 1,
            }}
          >
            {isSimulating ? "Simulating..." : "Test feed"}
          </button>

          {/* Time */}
          <time
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              color: "var(--text-quaternary)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            {time}
          </time>
        </div>
      </div>
    </header>
  );
};
