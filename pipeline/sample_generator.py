import os
import cv2
import numpy as np
from datetime import datetime

def create_sample_cctv_video(
    output_path: str,
    camera_name: str,
    camera_id: int,
    vehicles_data: list,
    duration_sec: int = 5,
    fps: int = 24,
    width: int = 640,
    height: int = 480
):
    """
    Synthesizes a realistic CCTV video clip with moving vehicles, realistic license plates,
    CCTV timestamps, camera telemetry, and night/day road textures.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    total_frames = duration_sec * fps

    for frame_idx in range(total_frames):
        # Base road/asphalt background with perspective lines
        frame = np.full((height, width, 3), (35, 38, 42), dtype=np.uint8)
        
        # Road lane lines
        cv2.line(frame, (width // 2, 0), (width // 2, height), (70, 70, 75), 2)
        cv2.line(frame, (width // 4, 0), (width // 4, height), (70, 70, 75), 1)
        cv2.line(frame, (3 * width // 4, 0), (3 * width // 4, height), (70, 70, 75), 1)
        
        # Dashed lane markings
        dash_offset = (frame_idx * 6) % 40
        for y in range(-dash_offset, height, 40):
            cv2.line(frame, (width // 2, y), (width // 2, y + 20), (220, 220, 220), 2)

        # Draw simulated moving vehicles and plates
        progress = frame_idx / float(total_frames)

        for v in vehicles_data:
            start_progress = v.get("start_prog", 0.0)
            end_progress = v.get("end_prog", 1.0)
            
            if start_progress <= progress <= end_progress:
                sub_p = (progress - start_progress) / max((end_progress - start_progress), 0.001)
                
                # Vehicle coordinates
                v_x = int(v["start_x"] + (v["end_x"] - v["start_x"]) * sub_p)
                v_y = int(v["start_y"] + (v["end_y"] - v["start_y"]) * sub_p)
                v_w = v.get("w", 180)
                v_h = v.get("h", 120)
                v_color = v.get("color", (180, 80, 40))  # BGR

                # Vehicle body (car rectangle)
                cv2.rectangle(frame, (v_x, v_y), (v_x + v_w, v_y + v_h), v_color, -1)
                cv2.rectangle(frame, (v_x, v_y), (v_x + v_w, v_y + v_h), (255, 255, 255), 2)

                # Windshield
                cv2.rectangle(frame, (v_x + 20, v_y + 15), (v_x + v_w - 20, v_y + 45), (100, 150, 180), -1)

                # License plate (white rectangle with black text and yellow border for IND)
                plate_x = v_x + (v_w // 2) - 55
                plate_y = v_y + v_h - 35
                plate_w = 110
                plate_h = 24
                
                cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (255, 255, 255), -1)
                cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (0, 180, 230), 1)
                # IND blue strip on left
                cv2.rectangle(frame, (plate_x, plate_y), (plate_x + 10, plate_y + plate_h), (200, 50, 20), -1)

                # Plate Text
                plate_text = v.get("plate", "DL01AB1234")
                cv2.putText(
                    frame, plate_text, (plate_x + 14, plate_y + 17),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 2, cv2.LINE_AA
                )

        # CCTV UI Overlays (Timestamp, Camera Name, REC badge)
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, f"[CAM-{camera_id:02d}] {camera_name}", (15, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 128), 2, cv2.LINE_AA)
        cv2.putText(frame, f"{now_str}.{frame_idx:02d} | 24 FPS", (15, 55),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)
        
        # Red REC indicator
        if (frame_idx // 12) % 2 == 0:
            cv2.circle(frame, (width - 60, 25), 6, (0, 0, 255), -1)
            cv2.putText(frame, "REC", (width - 48, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 2, cv2.LINE_AA)

        out.write(frame)

    out.release()
    print(f"Generated CCTV video: {output_path} ({duration_sec}s, {fps} fps)")

def generate_all_demo_videos(target_dir: str = "pipeline/demo_videos"):
    os.makedirs(target_dir, exist_ok=True)

    # 1. Camera 1: MG Road Junction (Shows DL01AB1234 & Wanted plate MH12DE1433)
    create_sample_cctv_video(
        output_path=os.path.join(target_dir, "cam_01_mg_road.mp4"),
        camera_name="MG Road Junction",
        camera_id=1,
        vehicles_data=[
            {
                "plate": "DL01AB1234",
                "start_x": 80, "start_y": 50,
                "end_x": 100, "end_y": 320,
                "start_prog": 0.0, "end_prog": 0.6,
                "color": (160, 90, 50),
                "w": 170, "h": 110
            },
            {
                "plate": "MH12DE1433",
                "start_x": 360, "start_y": 40,
                "end_x": 380, "end_y": 330,
                "start_prog": 0.4, "end_prog": 1.0,
                "color": (40, 40, 180),
                "w": 180, "h": 115
            }
        ]
    )

    # 2. Camera 2: Indiranagar 100ft Rd (Shows DL01AB1234 & KA05MB4567)
    create_sample_cctv_video(
        output_path=os.path.join(target_dir, "cam_02_indiranagar.mp4"),
        camera_name="Indiranagar 100ft Rd",
        camera_id=2,
        vehicles_data=[
            {
                "plate": "DL01AB1234",
                "start_x": 220, "start_y": 60,
                "end_x": 240, "end_y": 320,
                "start_prog": 0.1, "end_prog": 0.7,
                "color": (160, 90, 50),
                "w": 170, "h": 110
            },
            {
                "plate": "KA05MB4567",
                "start_x": 50, "start_y": 40,
                "end_x": 70, "end_y": 340,
                "start_prog": 0.5, "end_prog": 1.0,
                "color": (60, 140, 60),
                "w": 175, "h": 110
            }
        ]
    )

    # 3. Camera 3: Domlur Flyover (Shows DL01AB1234 & TN09BZ9999)
    create_sample_cctv_video(
        output_path=os.path.join(target_dir, "cam_03_domlur.mp4"),
        camera_name="Domlur Flyover",
        camera_id=3,
        vehicles_data=[
            {
                "plate": "DL01AB1234",
                "start_x": 120, "start_y": 50,
                "end_x": 150, "end_y": 320,
                "start_prog": 0.1, "end_prog": 0.7,
                "color": (160, 90, 50),
                "w": 170, "h": 110
            },
            {
                "plate": "TN09BZ9999",
                "start_x": 380, "start_y": 60,
                "end_x": 400, "end_y": 340,
                "start_prog": 0.4, "end_prog": 0.95,
                "color": (140, 60, 140),
                "w": 170, "h": 110
            }
        ]
    )

    # 4. Camera 4: Koramangala Sony Signal (Shows DL01AB1234)
    create_sample_cctv_video(
        output_path=os.path.join(target_dir, "cam_04_koramangala.mp4"),
        camera_name="Koramangala Sony Signal",
        camera_id=4,
        vehicles_data=[
            {
                "plate": "DL01AB1234",
                "start_x": 200, "start_y": 50,
                "end_x": 230, "end_y": 330,
                "start_prog": 0.15, "end_prog": 0.85,
                "color": (160, 90, 50),
                "w": 170, "h": 110
            }
        ]
    )

if __name__ == "__main__":
    generate_all_demo_videos()
