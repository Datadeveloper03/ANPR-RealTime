import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { Camera, TrajectoryResponse, TrajectoryPoint, HeatmapPoint } from "../types";
import { Layers } from "lucide-react";
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
const createCameraIcon = () => {
  return L.divIcon({
    className: "custom-camera-marker",
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(56, 189, 248, 0.3); animation: pulse-ring 2.5s infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #0f172a; border: 2px solid #38bdf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(56, 189, 248, 0.6); color: #38bdf8; font-weight: bold; font-size: 11px;">
          📹
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createVehicleIcon = (plate: string, isBlacklisted: boolean) => {
  const color = isBlacklisted ? "#ef4444" : "#38bdf8";
  return L.divIcon({
    className: "custom-vehicle-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; filter: drop-shadow(0 0 10px ${color});">
        <div style="position: absolute; inset: -6px; border-radius: 50%; background: ${isBlacklisted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}; animation: pulse-ring 1.5s infinite;"></div>
        <div style="width: 44px; height: 44px; border-radius: 12px; background: #090d16; border: 2px solid ${color}; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-size: 16px;">
          🚗
        </div>
        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: #0f172a; border: 1px solid ${color}; padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: bold; color: ${color}; white-space: nowrap;">
          ${plate}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const createCheckpointIcon = (step: number, isAnomaly: boolean) => {
  const bg = isAnomaly ? "#f59e0b" : "#0284c7";
  return L.divIcon({
    className: "custom-checkpoint-marker",
    html: `
      <div style="width: 22px; height: 22px; border-radius: 50%; background: ${bg}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: bold; font-size: 10px; box-shadow: 0 0 8px ${bg};">
        ${step}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
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
  // Default Center: Bangalore coordinates based on seeded cameras
  const defaultCenter: [number, number] = [12.965, 77.635];
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const sightings = trajectory?.sightings || [];
  const currentVehiclePoint: TrajectoryPoint | null = sightings[activePointIndex] || null;

  // Build Polyline positions
  const polylineCoords: [number, number][] = sightings.map((s) => [s.lat, s.lon]);

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
        display: "flex", gap: "8px"
      }}>
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

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <MapController targetCoords={mapCenter} />

        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Heatmap Layer */}
        <HeatmapLayer points={heatmapData} isVisible={showHeatmap} />

        {/* Fixed CCTV Camera Markers */}
        {cameras.map((cam) => (
          <Marker
            key={cam.id}
            position={[cam.lat, cam.lon]}
            icon={createCameraIcon()}
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
                  Camera Node: <strong>#{cam.id}</strong>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                  Coordinates: <code>{cam.lat.toFixed(4)}, {cam.lon.toFixed(4)}</code>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "4px" }}>
                  Sightings Logged: <strong>{cam.total_sightings}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Reconstructed Trajectory Polyline */}
        {polylineCoords.length > 1 && (
          <>
            {/* Glowing background halo */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: trajectory?.is_blacklisted ? "#ef4444" : "#38bdf8",
                weight: 8,
                opacity: 0.3,
                dashArray: "6, 8",
              }}
            />
            {/* Solid trajectory line */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: trajectory?.is_blacklisted ? "#ef4444" : "#0284c7",
                weight: 4,
                opacity: 0.9,
              }}
            />
          </>
        )}

        {/* Trajectory Checkpoints */}
        {sightings.map((pt, idx) => (
          <Marker
            key={pt.sighting_id}
            position={[pt.lat, pt.lon]}
            icon={createCheckpointIcon(idx + 1, !!pt.is_anomaly)}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <div style={{ fontWeight: "700", color: pt.is_anomaly ? "#f59e0b" : "#38bdf8", fontSize: "0.85rem" }}>
                  Checkpoint #{idx + 1}: {pt.camera_name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                  {new Date(pt.timestamp).toLocaleString()}
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
              trajectory!.is_blacklisted
            )}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <div style={{ fontWeight: "700", color: trajectory?.is_blacklisted ? "#ef4444" : "#38bdf8", fontSize: "0.9rem" }}>
                  🚗 {trajectory?.plate}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#e2e8f0" }}>
                  Current Node: <strong>{currentVehiclePoint.camera_name}</strong>
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
