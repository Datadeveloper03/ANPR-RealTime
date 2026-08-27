import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { Camera, TrajectoryResponse, TrajectoryPoint, HeatmapPoint } from "../types";
import { Layers, ShieldAlert, Navigation2 } from "lucide-react";
import "leaflet.heat";

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapViewProps {
  cameras: Camera[];
  trajectory: TrajectoryResponse | null;
  activePointIndex: number;
  heatmapData: HeatmapPoint[];
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  onSelectCamera: (cam: Camera) => void;
}

// Custom DivIcons for high aesthetic cyber styling
const createCameraIcon = (zoneType?: string) => {
  let borderColor = "#38bdf8";
  let iconSymbol = "📹";
  let pulseColor = "rgba(56, 189, 248, 0.3)";

  if (zoneType === "RESTRICTED_GEOFENCE") {
    borderColor = "#ef4444";
    iconSymbol = "🚫";
    pulseColor = "rgba(239, 68, 68, 0.4)";
  } else if (zoneType === "NO_PARKING") {
    borderColor = "#f59e0b";
    iconSymbol = "🅿️";
    pulseColor = "rgba(245, 158, 11, 0.4)";
  } else if (zoneType === "INTERSECTION") {
    borderColor = "#a855f7";
    iconSymbol = "🔄";
    pulseColor = "rgba(168, 85, 247, 0.4)";
  }

  return L.divIcon({
    className: "custom-camera-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; inset: -5px; border-radius: 50%; background: ${pulseColor}; animation: pulse-ring 2.5s infinite;"></div>
        <div style="width: 34px; height: 34px; border-radius: 50%; background: #0f172a; border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${borderColor}; color: ${borderColor}; font-weight: bold; font-size: 13px;">
          ${iconSymbol}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

const createVehicleIcon = (plate: string, isBlacklisted: boolean, hasAnomalies: boolean) => {
  const color = isBlacklisted ? "#ef4444" : hasAnomalies ? "#f59e0b" : "#38bdf8";
  return L.divIcon({
    className: "custom-vehicle-marker",
    html: `
      <div style="position: relative; width: 46px; height: 46px; filter: drop-shadow(0 0 12px ${color});">
        <div style="position: absolute; inset: -6px; border-radius: 50%; background: ${isBlacklisted ? 'rgba(239, 68, 68, 0.45)' : hasAnomalies ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.45)'}; animation: pulse-ring 1.5s infinite;"></div>
        <div style="width: 46px; height: 46px; border-radius: 12px; background: #090d16; border: 2px solid ${color}; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-size: 18px;">
          🚗
        </div>
        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: #0f172a; border: 1px solid ${color}; padding: 1px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: bold; color: ${color}; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.8);">
          ${plate}
        </div>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

const createCheckpointIcon = (step: number, isAnomaly: boolean, anomalyType?: string) => {
  let bg = "#0284c7";
  if (isAnomaly) {
    if (anomalyType === "DUPLICATE_PLATE" || anomalyType === "BLACKLIST_HIT") bg = "#ef4444";
    else if (anomalyType === "APPEARANCE_MISMATCH" || anomalyType === "GEOFENCE_VIOLATION") bg = "#f59e0b";
    else if (anomalyType === "ILLEGAL_UTURN") bg = "#a855f7";
    else bg = "#f59e0b";
  }

  return L.divIcon({
    className: "custom-checkpoint-marker",
    html: `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: ${bg}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: bold; font-size: 11px; box-shadow: 0 0 10px ${bg};">
        ${step}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map Recenter Controller
const MapController: React.FC<{ targetCoords: [number, number] | null }> = ({ targetCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, 14, { duration: 1.2 });
    }
  }, [targetCoords, map]);
  return null;
};

// Leaflet Heatmap Component
const HeatmapLayer: React.FC<{ points: HeatmapPoint[]; isVisible: boolean }> = ({ points, isVisible }) => {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!isVisible || points.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    const heatPoints = points.map((p) => [p.lat, p.lon, p.intensity * 25]);

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // @ts-ignore
    if (L.heatLayer) {
      // @ts-ignore
      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        gradient: { 0.2: "#38bdf8", 0.5: "#10b981", 0.7: "#f59e0b", 1.0: "#ef4444" },
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, isVisible]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  cameras,
  trajectory,
  activePointIndex,
  heatmapData,
  showHeatmap,
  setShowHeatmap,
  onSelectCamera,
}) => {
  const defaultCenter: [number, number] = [12.965, 77.635];
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapTheme, setMapTheme] = useState<"dark" | "cyber" | "satellite">("dark");
  const [showZones, setShowZones] = useState<boolean>(true);

  const sightings = trajectory?.sightings || [];
  const currentVehiclePoint: TrajectoryPoint | null = sightings[activePointIndex] || null;

  // Real road network coordinates or fallback straight connections
  const roadCoords: [number, number][] =
    trajectory?.route_coordinates && trajectory.route_coordinates.length > 1
      ? trajectory.route_coordinates
      : sightings.map((s) => [s.lat, s.lon]);

  // Recenter map when searching a trajectory
  useEffect(() => {
    if (sightings.length > 0 && currentVehiclePoint) {
      setMapCenter([currentVehiclePoint.lat, currentVehiclePoint.lon]);
    }
  }, [trajectory?.plate, activePointIndex, sightings.length, currentVehiclePoint]);

  return (
    <div className="glass-panel" style={{ height: "600px", position: "relative", overflow: "hidden", borderRadius: "12px" }}>
      
      {/* Map Overlay Controls */}
      <div style={{
        position: "absolute", top: "16px", right: "16px", zIndex: 1000,
        display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end"
      }}>
        {/* Map Theme Selector */}
        <div style={{
          display: "flex", background: "rgba(11, 17, 32, 0.85)", backdropFilter: "blur(8px)",
          borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "2px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
        }}>
          <button
            onClick={() => setMapTheme("dark")}
            style={{
              padding: "6px 10px", borderRadius: "6px", border: "none",
              background: mapTheme === "dark" ? "rgba(56, 189, 248, 0.25)" : "transparent",
              color: mapTheme === "dark" ? "#38bdf8" : "#94a3b8",
              fontSize: "0.72rem", fontWeight: "600", cursor: "pointer"
            }}
          >
            DARK
          </button>
          <button
            onClick={() => setMapTheme("cyber")}
            style={{
              padding: "6px 10px", borderRadius: "6px", border: "none",
              background: mapTheme === "cyber" ? "rgba(56, 189, 248, 0.25)" : "transparent",
              color: mapTheme === "cyber" ? "#38bdf8" : "#94a3b8",
              fontSize: "0.72rem", fontWeight: "600", cursor: "pointer"
            }}
          >
            CYBER
          </button>
          <button
            onClick={() => setMapTheme("satellite")}
            style={{
              padding: "6px 10px", borderRadius: "6px", border: "none",
              background: mapTheme === "satellite" ? "rgba(56, 189, 248, 0.25)" : "transparent",
              color: mapTheme === "satellite" ? "#38bdf8" : "#94a3b8",
              fontSize: "0.72rem", fontWeight: "600", cursor: "pointer"
            }}
          >
            SATELLITE
          </button>
        </div>

        {/* Zones Overlay Toggle */}
        <button
          onClick={() => setShowZones(!showZones)}
          style={{
            padding: "8px 12px", borderRadius: "8px",
            border: `1px solid ${showZones ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
            background: showZones ? "rgba(239, 68, 68, 0.2)" : "rgba(11, 17, 32, 0.85)",
            backdropFilter: "blur(8px)", color: showZones ? "#fca5a5" : "#94a3b8",
            fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
          }}
        >
          <ShieldAlert size={14} />
          {showZones ? "ZONES: ON" : "ZONES: OFF"}
        </button>

        {/* Heatmap Toggle */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{
            padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.4)",
            background: showHeatmap ? "rgba(56, 189, 248, 0.3)" : "rgba(11, 17, 32, 0.85)",
            backdropFilter: "blur(8px)", color: showHeatmap ? "#38bdf8" : "#94a3b8",
            fontSize: "0.78rem", fontWeight: "600", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
          }}
        >
          <Layers size={14} />
          {showHeatmap ? "HEATMAP: ON" : "HEATMAP: OFF"}
        </button>
      </div>

      {/* Map Legend on Top Left */}
      <div style={{
        position: "absolute", top: "16px", left: "16px", zIndex: 1000,
        background: "rgba(11, 17, 32, 0.85)", backdropFilter: "blur(8px)",
        borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "6px 10px", fontSize: "0.7rem", color: "#cbd5e1",
        display: "flex", gap: "10px", alignItems: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Navigation2 size={12} color="#38bdf8" />
          <span>Road Routing: <strong>{trajectory?.route_coordinates?.length ? "OSM Street Snapped" : "Active"}</strong></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}></span>
          <span>Restricted Zone</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></span>
          <span>No Parking</span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <MapController targetCoords={mapCenter} />

        {/* Base Tiles without API key or watermark */}
        {mapTheme === "dark" && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
            <TileLayer
              attribution=""
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
              opacity={0.8}
            />
          </>
        )}

        {mapTheme === "cyber" && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="osm-cyber-layer"
            maxZoom={19}
          />
        )}

        {mapTheme === "satellite" && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* Heatmap Layer */}
        <HeatmapLayer points={heatmapData} isVisible={showHeatmap} />

        {/* Geofence & Zone Overlays */}
        {showZones && (
          <>
            {/* Koramangala Restricted Geofence Security Zone */}
            <Circle
              center={[12.9340, 77.6250]}
              radius={900}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.15,
                weight: 2,
                dashArray: "4, 6",
              }}
            >
              <Popup>
                <div style={{ padding: "4px" }}>
                  <strong style={{ color: "#f87171" }}>🚫 RESTRICTED GEOFENCE ZONE</strong>
                  <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>Koramangala High-Security Perimeter</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Requires authorized clearance badge</div>
                </div>
              </Popup>
            </Circle>

            {/* Indiranagar No-Parking Tow-Away Zone */}
            <Circle
              center={[12.9784, 77.6408]}
              radius={400}
              pathOptions={{
                color: "#f59e0b",
                fillColor: "#f59e0b",
                fillOpacity: 0.12,
                weight: 2,
                dashArray: "3, 5",
              }}
            >
              <Popup>
                <div style={{ padding: "4px" }}>
                  <strong style={{ color: "#fbbf24" }}>🅿️ STRICT NO-PARKING ZONE</strong>
                  <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>Indiranagar 100ft Road Corridor</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Max dwell threshold: 2.0 mins</div>
                </div>
              </Popup>
            </Circle>
          </>
        )}

        {/* Fixed CCTV Camera Markers */}
        {cameras.map((cam) => (
          <Marker
            key={cam.id}
            position={[cam.lat, cam.lon]}
            icon={createCameraIcon(cam.zone_type)}
            eventHandlers={{
              click: () => onSelectCamera(cam),
            }}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <div style={{ fontWeight: "700", color: "#38bdf8", fontSize: "0.85rem", marginBottom: "4px" }}>
                  {cam.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                  Place: <strong>{cam.place_name || "Bangalore Central"}</strong>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                  Zone Type: <strong style={{ color: cam.zone_type === "RESTRICTED_GEOFENCE" ? "#ef4444" : cam.zone_type === "NO_PARKING" ? "#f59e0b" : "#38bdf8" }}>{cam.zone_type || "STANDARD"}</strong>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                  Direction: <code>{cam.direction || "NORTH"}</code> | Node: <code>#{cam.id}</code>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "4px" }}>
                  Sightings Logged: <strong>{cam.total_sightings}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Road-Network Routed Trajectory Polyline */}
        {roadCoords.length > 1 && (
          <>
            {/* Glowing neon halo following real street road geometry */}
            <Polyline
              positions={roadCoords}
              pathOptions={{
                color: trajectory?.is_blacklisted ? "#ef4444" : trajectory?.has_anomalies ? "#f59e0b" : "#38bdf8",
                weight: 8,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Crisp street route path */}
            <Polyline
              positions={roadCoords}
              pathOptions={{
                color: trajectory?.is_blacklisted ? "#dc2626" : trajectory?.has_anomalies ? "#d97706" : "#0284c7",
                weight: 4,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* Trajectory Checkpoints */}
        {sightings.map((pt, idx) => (
          <Marker
            key={pt.sighting_id}
            position={[pt.lat, pt.lon]}
            icon={createCheckpointIcon(idx + 1, !!pt.is_anomaly, pt.anomaly_type)}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <div style={{ fontWeight: "700", color: pt.is_anomaly ? "#f59e0b" : "#38bdf8", fontSize: "0.85rem" }}>
                  Checkpoint #{idx + 1}: {pt.camera_name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                  {new Date(pt.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "2px" }}>
                  Place: <strong>{pt.place_name || "Bangalore Central"}</strong> | Vehicle: <strong>{pt.vehicle_color} {pt.vehicle_type}</strong>
                </div>
                {pt.speed_from_prev_kmh !== null && (
                  <div style={{ fontSize: "0.75rem", marginTop: "4px", color: pt.is_anomaly ? "#ef4444" : "#cbd5e1" }}>
                    Speed: <strong>{pt.speed_from_prev_kmh} km/h</strong> ({pt.distance_from_prev_km} km)
                  </div>
                )}
                {pt.anomaly_reason && (
                  <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: "4px" }}>
                    ⚠️ {pt.anomaly_reason}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Animated Moving Vehicle Marker */}
        {currentVehiclePoint && (
          <Marker
            position={[currentVehiclePoint.lat, currentVehiclePoint.lon]}
            icon={createVehicleIcon(
              trajectory!.plate,
              trajectory!.is_blacklisted,
              trajectory!.has_anomalies
            )}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <div style={{ fontWeight: "700", color: trajectory?.is_blacklisted ? "#ef4444" : trajectory?.has_anomalies ? "#f59e0b" : "#38bdf8", fontSize: "0.9rem" }}>
                  🚗 {trajectory?.plate}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#e2e8f0", marginTop: "2px" }}>
                  Location: <strong>{currentVehiclePoint.camera_name}</strong>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  Vehicle Class: <strong>{currentVehiclePoint.vehicle_color} {currentVehiclePoint.vehicle_type} ({currentVehiclePoint.make})</strong>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {new Date(currentVehiclePoint.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

      </MapContainer>
    </div>
  );
};
