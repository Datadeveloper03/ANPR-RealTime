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
      badge: "🟢 Verified Clean",
      desc: "MG Rd -> Indiranagar -> Domlur -> Koramangala (Real Street Navigation)",
      icon: ShieldCheck,
      color: "#10b981",
    },
    {
      plate: "TN09BZ9999",
      label: "Vehicle Appearance Mismatch",
      badge: "⚠️ Mismatch Alert",
      desc: "Reg: Red Sedan | Detected: White Truck/Van",
      icon: Car,
      color: "#f59e0b",
    },
    {
      plate: "KA01MJ1122",
      label: "Cloned / Duplicate Plate",
      badge: "🚨 Ghost/Clone Alert",
      desc: "Sighted in Koramangala & E-City in 12s (10.7km apart)",
      icon: Copy,
      color: "#ef4444",
    },
    {
      plate: "KA04EK9081",
      label: "Geofence Zone Violation",
      badge: "🚫 Geofence Breach",
      desc: "Unauthorized heavy truck inside Koramangala Security Perimeter",
      icon: ShieldAlert,
      color: "#f43f5e",
    },
    {
      plate: "TS07AB4040",
      label: "Prohibited U-Turn",
      badge: "🔄 Illegal U-Turn",
      desc: "Opposing corridor reversal at MG Road Intersection in 28s",
      icon: RotateCcw,
      color: "#c084fc",
    },
    {
      plate: "DL08CD5566",
      label: "Illegal Parking / Dwell",
      badge: "🅿️ No-Parking Breach",
      desc: "Stationary dwell time of 9 mins in Indiranagar Tow Zone",
      icon: SquareParking,
      color: "#eab308",
    },
    {
      plate: "MH12DE1433",
      label: "Blacklisted Vehicle",
      badge: "🔴 Wanted Notice",
      desc: "Wanted in Stolen Vehicle / Red Notice #9921",
      icon: AlertTriangle,
      color: "#ef4444",
    },
    {
      plate: "KA05MB4567",
      label: "Extreme Speed Anomaly",
      badge: "⚡ Speed >390 km/h",
      desc: "Domlur -> Electronic City (13 km in 2 min)",
      icon: Zap,
      color: "#fbbf24",
    },
  ];

  return (
    <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
          <Search size={16} color="#38bdf8" /> Vehicle Plate Search & Road-Network Trajectory Reconstruct
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
            placeholder="Enter Indian License Plate (e.g. DL01AB1234, TN09BZ9999, KA01MJ1122)..."
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
          {isLoading ? "Routing..." : "Reconstruct Road Route"}
        </button>
      </form>

      {/* 1-Click Multi-Anomaly Demo Buttons */}
      <div>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "8px", fontWeight: "700", letterSpacing: "0.5px" }}>
          1-CLICK ADVANCED ANOMALY TEST SCENARIOS:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px" }}>
          {demoScenarios.map((demo) => {
            const isSelected = activePlate === demo.plate;
            const Icon = demo.icon;
            return (
              <button
                key={demo.plate}
                onClick={() => {
                  setSearchInput(demo.plate);
                  onSearch(demo.plate);
                }}
                style={{
                  padding: "9px 12px",
                  background: isSelected ? "rgba(56, 189, 248, 0.18)" : "rgba(17, 23, 38, 0.9)",
                  border: `1px solid ${isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.08)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon size={14} color={demo.color} />
                    <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#f8fafc", fontSize: "0.85rem" }}>
                      {demo.plate}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.68rem", color: demo.color, fontWeight: "700" }}>
                    {demo.badge}
                  </span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: "1.25" }}>
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
