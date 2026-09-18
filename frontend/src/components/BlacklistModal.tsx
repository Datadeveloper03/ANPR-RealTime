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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: "var(--space-5)" }}>
        <div>
          <h2 style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-semibold)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            color: "var(--text-primary)"
          }}>
            <ShieldAlert size={20} color="var(--text-tertiary)" strokeWidth={2} /> Blacklist
          </h2>
          <p style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-tertiary)",
            marginTop: "var(--space-1)"
          }}>
            Flagged vehicles trigger immediate alerts across all cameras
          </p>
        </div>
      </div>

      {/* Add New Blacklist Item Form */}
      <div className="glass-panel" style={{ padding: "var(--space-4)" }}>
        <h3 style={{
          fontSize: "var(--font-size-md)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          color: "var(--text-primary)"
        }}>
          <Plus size={16} strokeWidth={2} /> Add vehicle
        </h3>

        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "var(--space-3)", alignItems: "start" }}>
          <div>
            <input
              type="text"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="e.g. MH12DE1433"
              required
              style={{
                width: "100%",
                padding: "var(--space-3) var(--space-4)",
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-primary)",
                fontFamily: "monospace",
                fontSize: "var(--font-size-base)"
              }}
            />
          </div>

          <div>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Reason (e.g. Stolen vehicle, red notice)"
              required
              style={{
                width: "100%",
                padding: "var(--space-3) var(--space-4)",
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-primary)",
                fontSize: "var(--font-size-base)"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-danger)",
              color: "#fff",
              fontWeight: "var(--font-weight-medium)",
              fontSize: "var(--font-size-sm)",
              opacity: isSubmitting ? 0.6 : 1,
              whiteSpace: "nowrap"
            }}
          >
            {isSubmitting ? "Adding..." : "Add to blacklist"}
          </button>
        </form>

        {errorMsg && (
          <div style={{
            color: "var(--color-danger)",
            fontSize: "var(--font-size-sm)",
            marginTop: "var(--space-3)"
          }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Active Blacklist Entries */}
      <div className="glass-panel" style={{ padding: "var(--space-4)" }}>
        <h3 style={{
          fontSize: "var(--font-size-md)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-4)",
          color: "var(--text-primary)"
        }}>
          Blacklisted vehicles ({blacklist.length})
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {blacklist.length === 0 ? (
            <div style={{
              padding: "var(--space-8)",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "var(--font-size-sm)"
            }}>
              No vehicles blacklisted
            </div>
          ) : (
            blacklist.map((entry) => (
              <div
                key={entry.plate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-danger-soft)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  gap: "var(--space-3)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "monospace",
                    fontWeight: "var(--font-weight-semibold)",
                    fontSize: "var(--font-size-base)",
                    color: "var(--text-primary)",
                    background: "var(--bg-primary)",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-default)"
                  }}>
                    {entry.plate}
                  </div>
                  <div style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--text-secondary)",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {entry.reason}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                  <button
                    onClick={() => onSelectPlate(entry.plate)}
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-default)",
                      background: "var(--color-primary)",
                      color: "#ffffff",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "var(--font-weight-medium)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)"
                    }}
                  >
                    <Search size={12} strokeWidth={2} /> Trace
                  </button>
                  <button
                    onClick={() => handleDelete(entry.plate)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-default)",
                      background: "var(--bg-secondary)",
                      color: "var(--color-danger)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Trash2 size={14} strokeWidth={2} />
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
