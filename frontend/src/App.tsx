import { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { MapView } from "./components/MapView";
import { PlateSearch } from "./components/PlateSearch";
import { TrajectoryPlayer } from "./components/TrajectoryPlayer";
import { AlertsPanel } from "./components/AlertsPanel";
import { CameraFeedGrid } from "./components/CameraFeedGrid";
import { BlacklistModal } from "./components/BlacklistModal";
import { api } from "./services/api";
import { wsService } from "./services/websocket";
import type {
  Camera,
  TrajectoryResponse,
  HeatmapPoint,
  AlertMessage,
  SystemStats,
  BlacklistEntry,
  Sighting,
} from "./types";

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"map" | "cctv" | "blacklist">("map");

  // Telemetry & Data
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [recentSightings, setRecentSightings] = useState<Sighting[]>([]);

  // Trajectory & Search
  const [activePlate, setActivePlate] = useState<string>("DL01AB1234");
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingTrajectory, setIsLoadingTrajectory] = useState<boolean>(false);

  // Map Controls
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Alerts & WebSocket
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Play audio alert beep using Web Audio API
  const playAlertChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }, [soundEnabled]);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    try {
      const [cams, heat, st, bl, rec] = await Promise.all([
        api.getCameras(),
        api.getHeatmap(),
        api.getStats(),
        api.getBlacklist(),
        api.getRecentSightings(),
      ]);
      setCameras(cams);
      setHeatmapData(heat);
      setStats(st);
      setBlacklist(bl);
      setRecentSightings(rec);
    } catch (err) {
      console.error("Failed to load initial ANPR data:", err);
    }
  }, []);

  // Search Trajectory Handler
  const handleSearchTrajectory = useCallback(async (plate: string) => {
    if (!plate.trim()) return;
    setIsLoadingTrajectory(true);
    try {
      const data = await api.getTrajectory(plate);
      setActivePlate(data.plate);
      setTrajectory(data);
      setActivePointIndex(0);
      setIsPlaying(true);
      setActiveTab("map");
    } catch (err) {
      console.error("Error searching trajectory:", err);
      // Empty fallback state
      setTrajectory({
        plate: plate.toUpperCase(),
        is_blacklisted: false,
        total_sightings: 0,
        sightings: [],
        has_anomalies: false,
        anomalies: [],
      });
    } finally {
      setIsLoadingTrajectory(false);
    }
  }, []);

  // WebSocket Subscription
  useEffect(() => {
    wsService.connect("ws://localhost:8000/alerts");
    const interval = setInterval(() => {
      setWsConnected(wsService.getStatus());
    }, 1000);

    const unsubscribe = wsService.subscribe((alert: AlertMessage) => {
      if (alert.alert_type !== "SYSTEM_CONNECTED") {
        playAlertChime();
        // Refresh telemetry on new detection
        loadInitialData();
      }
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [playAlertChime, loadInitialData]);

  // Mount
  useEffect(() => {
    loadInitialData();
    handleSearchTrajectory("DL01AB1234");
  }, [loadInitialData, handleSearchTrajectory]);

  // Run Test CCTV Simulation Feed
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      // Simulate sequential sightings across camera nodes to demonstrate live alerts and trajectory
      const testPlates = [
        { plate: "DL01AB1234", cam: 1 },
        { plate: "MH12DE1433", cam: 2 }, // triggers blacklist alert!
        { plate: "KA05MB4567", cam: 5 }, // triggers speed alert!
      ];

      for (const item of testPlates) {
        await api.recordSighting(item.plate, item.cam, 0.98);
        await new Promise((res) => setTimeout(res, 800));
      }
      await loadInitialData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Top Telemetry Navbar */}
      <Navbar
        stats={stats}
        wsConnected={wsConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerSimulation={handleTriggerSimulation}
        isSimulating={isSimulating}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "0 16px 16px 16px" }}>
        {activeTab === "map" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
            
            {/* Left Column: Search Bar + Map + Trajectory Player */}
            <div>
              <PlateSearch
                onSearch={handleSearchTrajectory}
                isLoading={isLoadingTrajectory}
                activePlate={activePlate}
              />

              <MapView
                cameras={cameras}
                trajectory={trajectory}
                activePointIndex={activePointIndex}
                heatmapData={heatmapData}
                showHeatmap={showHeatmap}
                setShowHeatmap={setShowHeatmap}
                onSelectCamera={(cam) => {
                  console.log("Selected camera:", cam);
                }}
              />

              <TrajectoryPlayer
                trajectory={trajectory}
                activePointIndex={activePointIndex}
                setActivePointIndex={setActivePointIndex}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
              />
            </div>

            {/* Right Column: Live Intercept Alerts Stream */}
            <div>
              <AlertsPanel
                alerts={alerts}
                onSelectPlate={(plate) => handleSearchTrajectory(plate)}
                onClearAlerts={() => setAlerts([])}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
              />
            </div>

          </div>
        )}

        {activeTab === "cctv" && (
          <CameraFeedGrid
            cameras={cameras}
            recentSightings={recentSightings}
            onRefresh={loadInitialData}
            onSelectPlate={(plate) => {
              handleSearchTrajectory(plate);
              setActiveTab("map");
            }}
          />
        )}

        {activeTab === "blacklist" && (
          <BlacklistModal
            blacklist={blacklist}
            onRefresh={loadInitialData}
            onSelectPlate={(plate) => {
              handleSearchTrajectory(plate);
              setActiveTab("map");
            }}
          />
        )}
      </main>

    </div>
  );
}

export default App;
