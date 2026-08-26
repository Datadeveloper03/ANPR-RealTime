import React, { useState } from "react";
import { Search, AlertTriangle, ShieldCheck, Zap, Navigation } from "lucide-react";

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
      label: "Clean Multi-Cam Route",
      type: "clean",
      badge: "🟢 Verified Clean",
      desc: "Seq: Cam 1 -> 2 -> 3 -> 4 (Normal speed ~45 km/h)",
      icon: ShieldCheck,
      color: "#10b981",
    },
    {
      plate: "MH12DE1433",
      label: "Blacklisted Vehicle",
      type: "blacklist",
      badge: "🔴 Blacklist Alert",
      desc: "Wanted in Stolen Vehicle / Red Notice #9921",
      icon: AlertTriangle,
      color: "#ef4444",
    },
    {
      plate: "KA05MB4567",
      label: "Extreme Speed Anomaly",
      type: "speed",
      badge: "⚡ Speed >390 km/h",
      desc: "Domlur -> Electronic City (13 km in 2 min)",
      icon: Zap,
      color: "#f59e0b",
    },
    {
      plate: "TN09BZ9999",
      label: "Route Checkpoint Skip",
      type: "skip",
      badge: "⚠️ Checkpoint Skip",
      desc: "Skipped intermediary checkpoints in corridor",
      icon: Navigation,
      color: "#a855f7",
    },
  ];

  return (
    <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={16} color="#38bdf8" /> Vehicle Plate Search & Trajectory Reconstruct
        </h3>
        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
          Regex: <code style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "1px 4px", borderRadius: "3px" }}>^[A-Z]&#123;2&#125;[0-9]&#123;1,2&#125;[A-Z]&#123;1,3&#125;[0-9]&#123;4&#125;$</code>
        </span>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            placeholder="Enter Indian Plate (e.g. DL01AB1234, KA05MB4567, MH12DE1433)..."
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(10, 13, 20, 0.9)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              letterSpacing: "1px",
              outline: "none",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !searchInput.trim()}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: "600",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 10px rgba(56, 189, 248, 0.25)",
          }}
        >
          <Search size={16} />
          {isLoading ? "Tracing..." : "Reconstruct Path"}
        </button>
      </form>

      {/* 1-Click Demo Scenario Buttons */}
      <div>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "6px", fontWeight: "600", letterSpacing: "0.5px" }}>
          QUICK 1-CLICK DEMO VEHICLES (PRE-SEEDED TRAJECTORIES):
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
          {demoScenarios.map((demo) => {
            const isSelected = activePlate === demo.plate;
            return (
              <button
                key={demo.plate}
                onClick={() => {
                  setSearchInput(demo.plate);
                  onSearch(demo.plate);
                }}
                style={{
                  padding: "8px 10px",
                  background: isSelected ? "rgba(56, 189, 248, 0.18)" : "rgba(17, 23, 38, 0.9)",
                  border: `1px solid ${isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.08)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#f8fafc", fontSize: "0.82rem" }}>
                    {demo.plate}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: demo.color, fontWeight: "600" }}>
                    {demo.badge}
                  </span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
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
