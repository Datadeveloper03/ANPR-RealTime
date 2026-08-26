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
    <header className="glass-panel" style={{ margin: "12px 16px", padding: "12px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        
        {/* Left: Branding & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "10px",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 15px rgba(56, 189, 248, 0.4)"
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.15rem", fontWeight: "700", letterSpacing: "0.5px", color: "#f8fafc" }}>
                ANPR SENTINEL
              </h1>
              <span style={{
                fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px",
                background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: "600"
              }}>
                CITY-WIDE AI NET
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Real-Time Vehicle Tracking & Anomaly Detection System
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div style={{
          display: "flex", background: "rgba(10, 13, 20, 0.8)",
          padding: "4px", borderRadius: "8px", border: "1px solid var(--border-color)",
          gap: "4px"
        }}>
          <button
            onClick={() => setActiveTab("map")}
            style={{
              padding: "6px 14px", borderRadius: "6px", border: "none",
              fontSize: "0.82rem", fontWeight: "600", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              background: activeTab === "map" ? "rgba(56, 189, 248, 0.2)" : "transparent",
              color: activeTab === "map" ? "#38bdf8" : "#94a3b8",
              borderBottom: activeTab === "map" ? "2px solid #38bdf8" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            <Activity size={15} /> Command Map
          </button>
          <button
            onClick={() => setActiveTab("cctv")}
            style={{
              padding: "6px 14px", borderRadius: "6px", border: "none",
              fontSize: "0.82rem", fontWeight: "600", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              background: activeTab === "cctv" ? "rgba(56, 189, 248, 0.2)" : "transparent",
              color: activeTab === "cctv" ? "#38bdf8" : "#94a3b8",
              borderBottom: activeTab === "cctv" ? "2px solid #38bdf8" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            <Video size={15} /> CCTV Network Feeds
          </button>
          <button
            onClick={() => setActiveTab("blacklist")}
            style={{
              padding: "6px 14px", borderRadius: "6px", border: "none",
              fontSize: "0.82rem", fontWeight: "600", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              background: activeTab === "blacklist" ? "rgba(239, 68, 68, 0.2)" : "transparent",
              color: activeTab === "blacklist" ? "#f87171" : "#94a3b8",
              borderBottom: activeTab === "blacklist" ? "2px solid #ef4444" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            <AlertTriangle size={15} /> Blacklist Hub ({stats?.blacklisted_vehicles || 0})
          </button>
        </div>

        {/* Right: Quick Telemetry & Simulation Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          {/* Quick Stats Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Eye size={14} color="#38bdf8" />
              <span style={{ color: "#94a3b8" }}>Cameras:</span>
              <strong style={{ color: "#f8fafc" }}>{stats?.active_cameras || 6}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Car size={14} color="#10b981" />
              <span style={{ color: "#94a3b8" }}>Sightings:</span>
              <strong style={{ color: "#f8fafc" }}>{stats?.total_sightings || 0}</strong>
            </div>
          </div>

          {/* WebSocket Status Indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "4px 8px", borderRadius: "6px",
            background: wsConnected ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${wsConnected ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            fontSize: "0.72rem", color: wsConnected ? "#34d399" : "#f87171"
          }}>
            <Radio size={12} className={wsConnected ? "radar-pulse" : ""} />
            <span>{wsConnected ? "LIVE FEED ACTIVE" : "CONNECTING..."}</span>
          </div>

          {/* Simulation Trigger Button */}
          <button
            onClick={onTriggerSimulation}
            disabled={isSimulating}
            style={{
              padding: "7px 14px", borderRadius: "8px", border: "none",
              fontSize: "0.78rem", fontWeight: "600", cursor: isSimulating ? "not-allowed" : "pointer",
              background: isSimulating ? "#334155" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#ffffff", display: "flex", alignItems: "center", gap: "6px",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)"
            }}
          >
            <Activity size={14} />
            {isSimulating ? "SIMULATING FEEDS..." : "TEST CAM FEED"}
          </button>

          {/* Live Clock */}
          <div style={{
            fontFamily: "monospace", fontSize: "0.85rem", color: "#38bdf8",
            padding: "4px 8px", background: "rgba(56, 189, 248, 0.08)",
            borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.2)"
          }}>
            {time}
          </div>

        </div>

      </div>
    </header>
  );
};
