export interface Camera {
  id: number;
  name: string;
  lat: number;
  lon: number;
  total_sightings: number;
}

export interface TrajectoryPoint {
  sighting_id: number;
  camera_id: number;
  camera_name: string;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
  speed_from_prev_kmh?: number;
  distance_from_prev_km?: number;
  time_delta_seconds?: number;
  is_anomaly?: boolean;
  anomaly_reason?: string;
}

export interface TrajectoryResponse {
  plate: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  total_sightings: number;
  sightings: TrajectoryPoint[];
  has_anomalies: boolean;
  anomalies: string[];
}

export interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number;
  camera_id: number;
  camera_name: string;
  count: number;
}

export interface BlacklistEntry {
  plate: string;
  reason: string;
}

export interface Sighting {
  id: number;
  plate: string;
  camera_id: number;
  camera_name?: string;
  lat?: number;
  lon?: number;
  timestamp: string;
  confidence: number;
}

export interface AlertMessage {
  alert_type: "BLACKLIST_HIT" | "SPEED_ANOMALY" | "ROUTE_SKIP" | "SYSTEM_CONNECTED";
  plate?: string;
  camera_id?: number;
  camera_name?: string;
  lat?: number;
  lon?: number;
  timestamp: string;
  reason?: string;
  confidence?: number;
  speed_kmh?: number;
  message?: string;
}

export interface SystemStats {
  total_sightings: number;
  unique_vehicles: number;
  active_cameras: number;
  blacklisted_vehicles: number;
}
