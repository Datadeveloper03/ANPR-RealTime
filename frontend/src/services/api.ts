import type {
  Camera,
  TrajectoryResponse,
  HeatmapPoint,
  BlacklistEntry,
  Sighting,
  SystemStats,
  PlaceInventory,
  TimelineEvent,
  AnomalyType,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  async getCameras(): Promise<Camera[]> {
    const res = await fetch(`${API_BASE_URL}/cameras`);
    if (!res.ok) throw new Error("Failed to fetch cameras");
    return res.json();
  },

  async getPlaceInventories(): Promise<PlaceInventory[]> {
    const res = await fetch(`${API_BASE_URL}/cameras/places`);
    if (!res.ok) throw new Error("Failed to fetch place inventories");
    return res.json();
  },

  async getPlaceTimeline(placeName: string): Promise<TimelineEvent[]> {
    const res = await fetch(`${API_BASE_URL}/sightings/timeline/${encodeURIComponent(placeName)}`);
    if (!res.ok) throw new Error(`Failed to fetch timeline for ${placeName}`);
    return res.json();
  },

  async getTrajectory(plate: string): Promise<TrajectoryResponse> {
    const clean = plate.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
    const res = await fetch(`${API_BASE_URL}/trajectory/${clean}`);
    if (!res.ok) throw new Error(`Failed to fetch trajectory for ${plate}`);
    return res.json();
  },

  async getHeatmap(): Promise<HeatmapPoint[]> {
    const res = await fetch(`${API_BASE_URL}/heatmap`);
    if (!res.ok) throw new Error("Failed to fetch heatmap data");
    return res.json();
  },

  async getBlacklist(): Promise<BlacklistEntry[]> {
    const res = await fetch(`${API_BASE_URL}/blacklist`);
    if (!res.ok) throw new Error("Failed to fetch blacklist");
    return res.json();
  },

  async addToBlacklist(plate: string, reason: string): Promise<BlacklistEntry> {
    const res = await fetch(`${API_BASE_URL}/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plate, reason }),
    });
    if (!res.ok) throw new Error("Failed to add to blacklist");
    return res.json();
  },

  async removeFromBlacklist(plate: string): Promise<void> {
    const clean = plate.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
    const res = await fetch(`${API_BASE_URL}/blacklist/${clean}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove from blacklist");
  },

  async getRecentSightings(limit = 50): Promise<Sighting[]> {
    const res = await fetch(`${API_BASE_URL}/sightings/recent?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch recent sightings");
    return res.json();
  },

  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) throw new Error("Failed to fetch system stats");
    return res.json();
  },

  async triggerTestAlert(payload: {
    alert_type: AnomalyType;
    plate: string;
    camera_id: number;
    camera_name?: string;
    place_name?: string;
    lat?: number;
    lon?: number;
    timestamp: string;
    reason: string;
    confidence?: number;
    speed_kmh?: number;
    vehicle_type?: string;
    vehicle_color?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/alerts/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to trigger test alert");
    return res.json();
  },

  async recordSighting(
    plate: string,
    camera_id: number,
    confidence = 0.95,
    vehicle_type = "SEDAN",
    vehicle_color = "WHITE",
    make = "GENERIC"
  ): Promise<Sighting> {
    const res = await fetch(`${API_BASE_URL}/sightings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plate,
        camera_id,
        confidence,
        vehicle_type,
        vehicle_color,
        make,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error("Failed to record sighting");
    return res.json();
  },
};
