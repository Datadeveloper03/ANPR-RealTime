import React, { useState } from "react";
import { Plus, Trash2, ShieldAlert, Search } from "lucide-react";
import type { BlacklistEntry } from "../types";
import { api } from "../services/api";

interface BlacklistModalProps {
  blacklist: BlacklistEntry[];
  onRefresh: () => void;
  onSelectPlate: (plate: string) => void;
}

export const BlacklistModal: React.FC<BlacklistModalProps> = ({
  blacklist,
  onRefresh,
  onSelectPlate,
}) => {
  const [newPlate, setNewPlate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim() || !newReason.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await api.addToBlacklist(newPlate.trim(), newReason.trim());
      setNewPlate("");
      setNewReason("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add to blacklist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (plate: string) => {
    try {
      await api.removeFromBlacklist(plate);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#f87171" }}>
            <ShieldAlert size={20} color="#ef4444" /> Blacklist & Wanted Vehicle Registry
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>
            Any camera sighting of these license plates immediately triggers real-time Redis & WebSocket alert broadcast
          </p>
        </div>
      </div>

      {/* Add New Blacklist Item Form */}
      <div className="glass-panel" style={{ padding: "16px" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} color="#38bdf8" /> Flag New Vehicle into Watchlist
        </h3>

        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "10px", alignItems: "start" }}>
          <div>
            <input
              type="text"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="e.g. MH12DE1433"
              required
              style={{
                width: "100%", padding: "8px 12px", background: "rgba(10, 13, 20, 0.9)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
                color: "#f8fafc", fontFamily: "monospace", fontSize: "0.85rem"
              }}
            />
          </div>

          <div>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Alert Reason (e.g. STOLEN VEHICLE / RED NOTICE / TOLL EVASION)"
              required
              style={{
                width: "100%", padding: "8px 12px", background: "rgba(10, 13, 20, 0.9)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
                color: "#f8fafc", fontSize: "0.85rem"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "8px 16px", borderRadius: "6px", border: "none",
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              color: "#fff", fontWeight: "700", fontSize: "0.82rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 2px 10px rgba(239, 68, 68, 0.3)"
            }}
          >
            {isSubmitting ? "Adding..." : "Add to Blacklist"}
          </button>
        </form>

        {errorMsg && (
          <div style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "8px" }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Active Blacklist Entries */}
      <div className="glass-panel" style={{ padding: "16px" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "12px" }}>
          Active Watchlist ({blacklist.length} Flagged Plates)
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {blacklist.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              No vehicles currently blacklisted.
            </div>
          ) : (
            blacklist.map((entry) => (
              <div
                key={entry.plate}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    fontFamily: "monospace", fontWeight: "800", fontSize: "0.95rem",
                    color: "#fca5a5", background: "#000", padding: "4px 8px", borderRadius: "4px",
                    border: "1px solid #ef4444"
                  }}>
                    {entry.plate}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "#f8fafc", fontWeight: "600" }}>
                      {entry.reason}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => onSelectPlate(entry.plate)}
                    style={{
                      padding: "4px 10px", borderRadius: "6px", border: "1px solid #38bdf8",
                      background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8",
                      fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <Search size={12} /> Trace
                  </button>
                  <button
                    onClick={() => handleDelete(entry.plate)}
                    style={{
                      padding: "4px 8px", borderRadius: "6px", border: "none",
                      background: "rgba(239, 68, 68, 0.2)", color: "#f87171",
                      cursor: "pointer", display: "flex", alignItems: "center"
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
