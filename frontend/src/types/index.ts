export interface Camera {
  id: number;
  name: string;
  lat: number;
  lon: number;
  place_name?: string;
  zone_type?: "STANDARD" | "RESTRICTED_GEOFENCE" | "NO_PARKING" | "INTERSECTION";
  direction?: string;
  max_dwell_minutes?: number;
  total_sightings: number;
  video_url?: string;
  video_filename?: string;
}

export interface VehicleRegistryProfile {
  plate: string;
  registered_type: string;
  registered_color: string;
  make: string;
  model?: string;
  owner_name?: string;
  is_geofence_authorized: boolean;
}

export interface TrajectoryPoint {
  sighting_id: number;
  camera_id: number;
  camera_name: string;
  place_name?: string;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
  vehicle_type?: string;
  vehicle_color?: string;
  make?: string;
  speed_from_prev_kmh?: number;
  distance_from_prev_km?: number;
  time_delta_seconds?: number;
  is_anomaly?: boolean;
  anomaly_type?: string;
  anomaly_reason?: string;
}

export interface TrajectoryResponse {
  plate: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  registered_profile?: VehicleRegistryProfile;
  total_sightings: number;
  sightings: TrajectoryPoint[];
  route_coordinates?: [number, number][]; // Street-snapped coordinates [[lat, lon], ...]
  has_anomalies: boolean;
  anomalies: string[];
}

export interface TimelineEvent {
  event_id: number;
  event_sequence: number;
  sighting_id: number;
  plate: string;
  timestamp: string;
  camera_id: number;
  camera_name: string;
  vehicle_type: string;
  vehicle_color: string;
  make: string;
  confidence: number;
  speed_kmh?: number;
  alert_type?: string;
  is_anomaly: boolean;
  anomaly_reason?: string;
}

export interface PlaceInventory {
  place_name: string;
  zone_type: string;
  camera_count: number;
  total_sightings_today: number;
  anomaly_count: number;
  cameras: Camera[];
  events_timeline: TimelineEvent[];
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
  place_name?: string;
  zone_type?: string;
  lat?: number;
  lon?: number;
  timestamp: string;
  confidence: number;
  vehicle_type?: string;
  vehicle_color?: string;
  make?: string;
}

export type AnomalyType =
  | "BLACKLIST_HIT"
  | "SPEED_ANOMALY"
  | "ROUTE_SKIP"
  | "DUPLICATE_PLATE"
  | "APPEARANCE_MISMATCH"
  | "GEOFENCE_VIOLATION"
  | "ILLEGAL_UTURN"
  | "ILLEGAL_PARKING"
  | "SYSTEM_CONNECTED";

export interface AlertMessage {
  alert_type: AnomalyType;
  plate?: string;
  camera_id?: number;
  camera_name?: string;
  place_name?: string;
  lat?: number;
  lon?: number;
  timestamp: string;
  reason?: string;
  confidence?: number;
  speed_kmh?: number;
  vehicle_type?: string;
  vehicle_color?: string;
  expected_profile?: string;
  message?: string;
}

export interface SystemStats {
  total_sightings: number;
  unique_vehicles: number;
  active_cameras: number;
  blacklisted_vehicles: number;
}
