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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* Header */}
      <div className="surface" style={{ padding: "var(--space-6)" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: "var(--space-2)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <ShieldAlert size={20} strokeWidth={2} /> Blacklist
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            letterSpacing: "-0.01em",
          }}
        >
          Flagged vehicles trigger immediate alerts across all cameras
        </p>
      </div>

      {/* Add form */}
      <div className="surface" style={{ padding: "var(--space-6)" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "var(--space-5)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            letterSpacing: "-0.02em",
          }}
        >
          <Plus size={16} strokeWidth={2} /> Add vehicle
        </h3>

        <form onSubmit={handleAdd}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr auto",
              gap: "var(--space-3)",
              alignItems: "start",
            }}
          >
            <input
              type="text"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="e.g. MH12DE1433"
              required
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-xl)",
                fontFamily: "monospace",
                fontSize: "14px",
                letterSpacing: "0.02em",
                fontWeight: 500,
              }}
            />

            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Reason (e.g. Stolen vehicle)"
              required
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-xl)",
                fontSize: "14px",
              }}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "12px 24px",
                borderRadius: "var(--radius-full)",
                background: "var(--danger)",
                color: "#fff",
                fontWeight: 500,
                fontSize: "13px",
                opacity: isSubmitting ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: "12px",
                marginTop: "var(--space-3)",
              }}
            >
              {errorMsg}
            </div>
          )}
        </form>
      </div>

      {/* List */}
      <div className="surface" style={{ padding: "var(--space-6)" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "var(--space-5)",
            letterSpacing: "-0.02em",
          }}
        >
          Blacklisted vehicles ({blacklist.length})
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {blacklist.length === 0 ? (
            <div
              style={{
                padding: "var(--space-16)",
                textAlign: "center",
                color: "var(--text-quaternary)",
                fontSize: "12px",
              }}
            >
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
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--danger-soft)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  gap: "var(--space-4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "14px",
                      letterSpacing: "0.02em",
                      background: "var(--bg-primary)",
                      padding: "8px 14px",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {entry.plate}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.reason}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => onSelectPlate(entry.plate)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--accent)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Search size={12} strokeWidth={2} /> Trace
                  </button>
                  <button
                    onClick={() => handleDelete(entry.plate)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      background: "var(--bg-elevated)",
                      color: "var(--danger)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
