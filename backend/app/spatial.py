import math
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) in kilometers.
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    R = 6371.0  # Earth's radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return distance

def calculate_speed_kmh(dist_km: float, time_delta_seconds: float) -> float:
    """
    Calculate speed in km/h given distance in km and time in seconds.
    """
    if time_delta_seconds <= 0:
        # Avoid division by zero, return high number if distance > 0
        return 999.0 if dist_km > 0.01 else 0.0
    
    hours = time_delta_seconds / 3600.0
    return dist_km / hours

def analyze_trajectory_anomalies(
    sightings_data: List[Dict[str, Any]], 
    max_speed_kmh: float = 140.0,
    min_speed_kmh: float = 0.5
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Iterates through chronologically ordered sightings, computes inter-camera
    metrics, and detects speed anomalies or checkpoint skip anomalies.
    """
    processed = []
    anomalies = []
    
    for i, curr in enumerate(sightings_data):
        curr_copy = dict(curr)
        curr_copy["speed_from_prev_kmh"] = None
        curr_copy["distance_from_prev_km"] = None
        curr_copy["time_delta_seconds"] = None
        curr_copy["is_anomaly"] = False
        curr_copy["anomaly_reason"] = None

        if i > 0:
            prev = sightings_data[i - 1]
            dist_km = haversine_distance_km(
                prev["lat"], prev["lon"],
                curr["lat"], curr["lon"]
            )
            
            t_curr = curr["timestamp"] if isinstance(curr["timestamp"], datetime) else datetime.fromisoformat(str(curr["timestamp"]))
            t_prev = prev["timestamp"] if isinstance(prev["timestamp"], datetime) else datetime.fromisoformat(str(prev["timestamp"]))
            
            time_delta = max((t_curr - t_prev).total_seconds(), 0.1)
            speed = calculate_speed_kmh(dist_km, time_delta)
            
            curr_copy["distance_from_prev_km"] = round(dist_km, 3)
            curr_copy["time_delta_seconds"] = round(time_delta, 1)
            curr_copy["speed_from_prev_kmh"] = round(speed, 1)

            # Speed anomaly check
            if dist_km > 0.05 and speed > max_speed_kmh:
                reason = f"Physically implausible speed of {round(speed, 1)} km/h between {prev.get('camera_name', 'Cam ' + str(prev.get('camera_id')))} and {curr.get('camera_name', 'Cam ' + str(curr.get('camera_id')))} ({round(dist_km, 2)} km in {int(time_delta)}s)"
                curr_copy["is_anomaly"] = True
                curr_copy["anomaly_reason"] = reason
                anomalies.append(reason)
            
            # Route skip check (e.g. sequence jump over corridor without detection)
            # If camera ID jump is unusually large with high speed
            prev_cam_id = prev.get("camera_id")
            curr_cam_id = curr.get("camera_id")
            if prev_cam_id and curr_cam_id and abs(curr_cam_id - prev_cam_id) > 2 and dist_km > 5.0 and time_delta < 120:
                skip_reason = f"Route jump anomaly: skipped checkpoints between Camera #{prev_cam_id} and #{curr_cam_id} in {int(time_delta)}s"
                if not curr_copy["is_anomaly"]:
                    curr_copy["is_anomaly"] = True
                    curr_copy["anomaly_reason"] = skip_reason
                anomalies.append(skip_reason)

        processed.append(curr_copy)

    return processed, anomalies
