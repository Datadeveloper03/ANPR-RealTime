import os
import subprocess
import shutil
import cv2
import numpy as np
from datetime import datetime

def draw_car_body(frame, v_type, color, x, y, w, h, facing="DOWN"):
    """
    Renders realistic vehicle geometry (chassis, roof, windshield, side windows, headlights, taillights, wheels).
    """
    b, g, r = color
    darker_color = (max(0, b - 40), max(0, g - 40), max(0, r - 40))
    highlight_color = (min(255, b + 50), min(255, g + 50), min(255, r + 50))
    
    # Shadow under vehicle
    shadow_pad = 12
    cv2.ellipse(frame, (x + w // 2, y + h // 2 + 4), (w // 2 + shadow_pad, h // 2 + 4), 0, 0, 360, (15, 18, 22), -1)

    # Wheels (4 black rounded rectangles with rims)
    wheel_w = int(w * 0.14)
    wheel_h = int(h * 0.22)
    wheel_color = (25, 25, 25)
    rim_color = (160, 165, 170)
    
    wheel_positions = [
        (x + int(w * 0.08), y + int(h * 0.12)),
        (x + w - int(w * 0.08) - wheel_w, y + int(h * 0.12)),
        (x + int(w * 0.08), y + h - int(h * 0.12) - wheel_h),
        (x + w - int(w * 0.08) - wheel_w, y + h - int(h * 0.12) - wheel_h)
    ]
    for wx, wy in wheel_positions:
        cv2.rectangle(frame, (wx, wy), (wx + wheel_w, wy + wheel_h), wheel_color, -1)
        cv2.rectangle(frame, (wx + 2, wy + 2), (wx + wheel_w - 2, wy + wheel_h - 2), rim_color, 1)

    # Main Body Chassis
    cv2.rectangle(frame, (x, y), (x + w, y + h), darker_color, -1)
    cv2.rectangle(frame, (x + 3, y + 3), (x + w - 3, y + h - 3), color, -1)
    cv2.rectangle(frame, (x, y), (x + w, y + h), (200, 210, 220), 1)

    # Vehicle Specific Details
    if v_type == "SEDAN":
        cv2.rectangle(frame, (x + 12, y + 10), (x + w - 12, y + int(h * 0.3)), highlight_color, 1)
        cv2.rectangle(frame, (x + 14, y + int(h * 0.3)), (x + w - 14, y + int(h * 0.48)), (70, 110, 140), -1)
        cv2.line(frame, (x + 20, y + int(h * 0.45)), (x + int(w * 0.45), y + int(h * 0.32)), (180, 220, 255), 2)
        cv2.rectangle(frame, (x + 16, y + int(h * 0.48)), (x + w - 16, y + int(h * 0.72)), darker_color, -1)
        cv2.rectangle(frame, (x + 14, y + int(h * 0.72)), (x + w - 14, y + int(h * 0.85)), (50, 80, 100), -1)
        
    elif v_type == "SUV":
        cv2.rectangle(frame, (x + 10, y + 8), (x + w - 10, y + int(h * 0.32)), highlight_color, 2)
        cv2.line(frame, (x + 8, y + int(h * 0.35)), (x + 8, y + int(h * 0.82)), (180, 180, 180), 2)
        cv2.line(frame, (x + w - 8, y + int(h * 0.35)), (x + w - 8, y + int(h * 0.82)), (180, 180, 180), 2)
        cv2.rectangle(frame, (x + 12, y + int(h * 0.32)), (x + w - 12, y + int(h * 0.52)), (60, 100, 130), -1)
        cv2.rectangle(frame, (x + 14, y + int(h * 0.52)), (x + w - 14, y + int(h * 0.82)), darker_color, -1)
        cv2.rectangle(frame, (x + 12, y + int(h * 0.82)), (x + w - 12, y + int(h * 0.90)), (50, 80, 100), -1)

    elif v_type == "TRUCK":
        cab_h = int(h * 0.38)
        cv2.rectangle(frame, (x + 8, y + 8), (x + w - 8, y + cab_h), color, -1)
        cv2.rectangle(frame, (x + 12, y + 14), (x + w - 12, y + cab_h - 10), (80, 120, 150), -1)
        cargo_y = y + cab_h + 8
        cv2.rectangle(frame, (x + 4, cargo_y), (x + w - 4, y + h - 8), (50, 55, 60), -1)
        cv2.rectangle(frame, (x + 4, cargo_y), (x + w - 4, y + h - 8), (140, 140, 140), 2)
        for rib_y in range(cargo_y + 16, y + h - 14, 20):
            cv2.line(frame, (x + 10, rib_y), (x + w - 10, rib_y), (75, 80, 85), 2)

    elif v_type == "HATCHBACK":
        cv2.rectangle(frame, (x + 10, y + 8), (x + w - 10, y + int(h * 0.28)), highlight_color, 1)
        cv2.rectangle(frame, (x + 12, y + int(h * 0.28)), (x + w - 12, y + int(h * 0.50)), (65, 105, 135), -1)
        cv2.rectangle(frame, (x + 14, y + int(h * 0.50)), (x + w - 14, y + int(h * 0.76)), darker_color, -1)
        cv2.rectangle(frame, (x + 12, y + int(h * 0.76)), (x + w - 12, y + int(h * 0.88)), (45, 75, 95), -1)

    elif v_type == "VAN":
        cv2.rectangle(frame, (x + 8, y + 10), (x + w - 8, y + int(h * 0.35)), (80, 120, 150), -1)
        cv2.rectangle(frame, (x + 10, y + int(h * 0.35)), (x + w - 10, y + h - 10), darker_color, -1)
        cv2.line(frame, (x + w // 2, y + int(h * 0.4)), (x + w // 2, y + h - 10), (140, 140, 140), 1)

    else:
        cv2.rectangle(frame, (x + 12, y + 10), (x + w - 12, y + int(h * 0.45)), (75, 115, 145), -1)
        cv2.rectangle(frame, (x + 14, y + int(h * 0.45)), (x + w - 14, y + int(h * 0.75)), darker_color, -1)

    # Headlights & Taillights
    if facing == "DOWN":
        hl_w = int(w * 0.18)
        cv2.rectangle(frame, (x + 8, y + h - 12), (x + 8 + hl_w, y + h - 2), (240, 250, 255), -1)
        cv2.rectangle(frame, (x + w - 8 - hl_w, y + h - 2), (x + w - 8, y + h - 2), (240, 250, 255), -1)
        cv2.rectangle(frame, (x + 8, y + 4), (x + 8 + hl_w, y + 12), (30, 30, 220), -1)
        cv2.rectangle(frame, (x + w - 8 - hl_w, y + 4), (x + w - 8, y + 12), (30, 30, 220), -1)
    else:
        hl_w = int(w * 0.18)
        cv2.rectangle(frame, (x + 8, y + 4), (x + 8 + hl_w, y + 14), (240, 250, 255), -1)
        cv2.rectangle(frame, (x + w - 8 - hl_w, y + 4), (x + w - 8, y + 14), (240, 250, 255), -1)

    # Side Mirrors
    mirror_w = 8
    mirror_h = 14
    mirror_y = y + int(h * 0.35)
    cv2.rectangle(frame, (x - mirror_w + 1, mirror_y), (x + 1, mirror_y + mirror_h), color, -1)
    cv2.rectangle(frame, (x + w - 1, mirror_y), (x + w + mirror_w - 1, mirror_y + mirror_h), color, -1)

def draw_hsrp_plate(frame, plate_text, plate_x, plate_y, plate_w=128, plate_h=30, is_commercial=False):
    """
    Renders high-definition Indian HSRP license plate with IND blue strip and bold text.
    """
    bg_color = (0, 220, 255) if is_commercial else (255, 255, 255)
    cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), bg_color, -1)
    cv2.rectangle(frame, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (20, 20, 20), 2)
    
    ind_width = 16
    cv2.rectangle(frame, (plate_x, plate_y), (plate_x + ind_width, plate_y + plate_h), (180, 50, 10), -1)
    cv2.putText(
        frame, "IND", (plate_x + 2, plate_y + plate_h - 10),
        cv2.FONT_HERSHEY_SIMPLEX, 0.28, (255, 255, 255), 1, cv2.LINE_AA
    )
    cv2.circle(frame, (plate_x + ind_width // 2, plate_y + 8), 3, (240, 240, 240), 1)

    cv2.circle(frame, (plate_x + ind_width + 6, plate_y + plate_h // 2), 2, (100, 100, 100), -1)
    cv2.circle(frame, (plate_x + plate_w - 6, plate_y + plate_h // 2), 2, (100, 100, 100), -1)

    clean_p = plate_text.replace(" ", "").upper()
    if len(clean_p) == 10:
        formatted = f"{clean_p[:2]} {clean_p[2:4]} {clean_p[4:6]} {clean_p[6:]}"
    elif len(clean_p) == 9:
        formatted = f"{clean_p[:2]} {clean_p[2:4]} {clean_p[4:5]} {clean_p[5:]}"
    else:
        formatted = clean_p

    font_scale = 0.48 if len(formatted) > 12 else 0.52
    text_x = plate_x + ind_width + 10
    text_y = plate_y + plate_h - 9

    cv2.putText(frame, formatted, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), 2, cv2.LINE_AA)
    cv2.putText(frame, formatted, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (10, 10, 10), 1, cv2.LINE_AA)

def create_realistic_cctv_video(
    output_path: str,
    camera_name: str,
    camera_id: int,
    place_name: str,
    gps_coords: str,
    vehicles_data: list,
    duration_sec: int = 8,
    fps: int = 30,
    width: int = 720,
    height: int = 480
):
    """
    Synthesizes a realistic CCTV multi-lane highway/junction surveillance clip
    with multiple moving vehicles, accurate perspective, shadows, HSRP plates,
    and encodes to web-compliant H.264 video.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    temp_path = output_path.replace(".mp4", "_raw.mp4")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))
    total_frames = duration_sec * fps

    lane_x1 = int(width * 0.15)
    lane_x2 = int(width * 0.38)
    lane_x3 = int(width * 0.62)
    lane_x4 = int(width * 0.85)

    for frame_idx in range(total_frames):
        frame = np.full((height, width, 3), (32, 35, 40), dtype=np.uint8)

        # Sidewalk / Curbs
        cv2.rectangle(frame, (0, 0), (lane_x1 - 10, height), (55, 60, 68), -1)
        cv2.rectangle(frame, (lane_x4 + 10, 0), (width, height), (55, 60, 68), -1)
        stripe_step = (frame_idx * 4) % 30
        for sy in range(-stripe_step, height, 30):
            cv2.rectangle(frame, (lane_x1 - 10, sy), (lane_x1 - 4, sy + 15), (20, 200, 230), -1)
            cv2.rectangle(frame, (lane_x4 + 4, sy), (lane_x4 + 10, sy + 15), (20, 200, 230), -1)

        cv2.line(frame, (lane_x1, 0), (lane_x1, height), (220, 225, 230), 2)
        cv2.line(frame, (lane_x4, 0), (lane_x4, height), (220, 225, 230), 2)

        dash_speed = (frame_idx * 8) % 45
        for y in range(-dash_speed, height + 45, 45):
            cv2.line(frame, (lane_x2, y), (lane_x2, y + 24), (200, 205, 210), 2)
            cv2.line(frame, (lane_x3, y), (lane_x3, y + 24), (200, 205, 210), 2)

        noise = np.random.randint(-3, 4, (height, width, 3), dtype=np.int16)
        frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        progress = frame_idx / float(total_frames)

        active_vehicles = []
        for v in vehicles_data:
            s_prog = v.get("start_prog", 0.0)
            e_prog = v.get("end_prog", 1.0)

            if s_prog <= progress <= e_prog:
                sub_p = (progress - s_prog) / max(e_prog - s_prog, 0.001)

                start_x, start_y = v["start_x"], v["start_y"]
                end_x, end_y = v["end_x"], v["end_y"]
                
                cur_x = int(start_x + (end_x - start_x) * sub_p)
                cur_y = int(start_y + (end_y - start_y) * sub_p)
                
                v_w = v.get("w", 185)
                v_h = v.get("h", 125)
                v_type = v.get("type", "SEDAN")
                v_color = v.get("color", (180, 80, 40))
                v_plate = v.get("plate", "DL01AB1234")
                is_comm = v_type == "TRUCK" or v.get("is_commercial", False)

                draw_car_body(frame, v_type, v_color, cur_x, cur_y, v_w, v_h, facing="DOWN")

                plate_w = 126
                plate_h = 28
                plate_x = cur_x + (v_w - plate_w) // 2
                plate_y = cur_y + v_h - 38

                draw_hsrp_plate(frame, v_plate, plate_x, plate_y, plate_w, plate_h, is_commercial=is_comm)

                if 0.25 <= sub_p <= 0.85:
                    cv2.rectangle(frame, (cur_x - 4, cur_y - 4), (cur_x + v_w + 4, cur_y + v_h + 4), (56, 189, 248), 1)
                    cv2.rectangle(frame, (plate_x - 2, plate_y - 2), (plate_x + plate_w + 2, plate_y + plate_h + 2), (0, 255, 128), 1)
                    tag_text = f"ANPR: {v_plate} [{(0.95 + 0.04 * (1 - abs(sub_p - 0.55))):.2f}]"
                    cv2.rectangle(frame, (cur_x - 4, cur_y - 20), (cur_x + 190, cur_y - 4), (10, 15, 25), -1)
                    cv2.putText(frame, tag_text, (cur_x, cur_y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1, cv2.LINE_AA)

                active_vehicles.append(v)

        # Telemetry HUD
        cv2.rectangle(frame, (0, 0), (width, 42), (8, 12, 18), -1)
        cv2.line(frame, (0, 42), (width, 42), (40, 50, 65), 1)

        cv2.putText(
            frame, f"CAM-{camera_id:02d} // {camera_name.upper()} [{place_name.upper()}]",
            (14, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (56, 189, 248), 2, cv2.LINE_AA
        )

        cv2.putText(
            frame, f"GPS: {gps_coords} | OPTICAL FEED | 30.00 FPS",
            (width - 330, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (180, 195, 210), 1, cv2.LINE_AA
        )

        cv2.rectangle(frame, (0, height - 34), (width, height), (8, 12, 18), -1)
        cv2.line(frame, (0, height - 34), (width, height - 34), (40, 50, 65), 1)

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        msec = int((frame_idx % fps) * (1000 / fps))
        cv2.putText(
            frame, f"{now_str}.{msec:03d} UTC+05:30",
            (14, height - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (220, 230, 240), 1, cv2.LINE_AA
        )

        active_count = len(active_vehicles)
        status_text = f"TRACKED TARGETS: {active_count} | YOLOv8-ANPR ACTIVE | 30 FPS"
        cv2.putText(
            frame, status_text,
            (width - 360, height - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (52, 211, 153), 1, cv2.LINE_AA
        )

        # Pulse indicator
        if (frame_idx // 15) % 2 == 0:
            cv2.circle(frame, (width - 45, 24), 5, (56, 189, 248), -1)

        out.write(frame)

    out.release()

    # Convert to standard Web-compliant H.264 with FFmpeg
    try:
        cmd = [
            "ffmpeg", "-y", "-i", temp_path,
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            output_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"Generated Web-Compliant H.264 CCTV Video: {output_path} ({duration_sec}s, {fps} fps)")
    except Exception as e:
        print(f"FFmpeg conversion notice ({e}). Keeping standard output: {output_path}")
        if os.path.exists(temp_path):
            shutil.move(temp_path, output_path)

def generate_all_demo_videos(target_dir: str = "pipeline/demo_videos"):
    """
    Generates rich, multi-vehicle surveillance demo videos for all 8 CCTV cameras.
    """
    os.makedirs(target_dir, exist_ok=True)
    print(f"Generating full suite of 8 CCTV camera feeds in '{target_dir}'...")

    C_WHITE = (235, 235, 235)
    C_BLACK = (35, 35, 35)
    C_SILVER = (180, 185, 190)
    C_RED = (40, 45, 200)
    C_BLUE = (190, 80, 30)
    C_YELLOW = (20, 190, 240)
    C_GREY = (110, 115, 120)

    # 1. Camera 1: MG Road Junction
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_01_mg_road.mp4"),
        camera_name="MG Road Junction",
        camera_id=1,
        place_name="MG Road",
        gps_coords="12.9756 N, 77.6067 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "DL01AB1234", "type": "SEDAN", "color": C_WHITE, "start_x": 130, "start_y": 30, "end_x": 160, "end_y": 340, "start_prog": 0.0, "end_prog": 0.45, "w": 180, "h": 120},
            {"plate": "MH12DE1433", "type": "SUV", "color": C_BLACK, "start_x": 390, "start_y": 20, "end_x": 420, "end_y": 330, "start_prog": 0.25, "end_prog": 0.70, "w": 190, "h": 130},
            {"plate": "KA03HA4321", "type": "HATCHBACK", "color": C_SILVER, "start_x": 150, "start_y": 30, "end_x": 170, "end_y": 340, "start_prog": 0.50, "end_prog": 0.95, "w": 165, "h": 115},
            {"plate": "TS07AB4040", "type": "SUV", "color": C_WHITE, "start_x": 380, "start_y": 30, "end_x": 410, "end_y": 335, "start_prog": 0.60, "end_prog": 1.00, "w": 185, "h": 125}
        ]
    )

    # 2. Camera 2: Indiranagar 100ft Rd
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_02_indiranagar.mp4"),
        camera_name="Indiranagar 100ft Rd",
        camera_id=2,
        place_name="Indiranagar",
        gps_coords="12.9784 N, 77.6408 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "DL01AB1234", "type": "SEDAN", "color": C_WHITE, "start_x": 260, "start_y": 30, "end_x": 280, "end_y": 330, "start_prog": 0.05, "end_prog": 0.50, "w": 180, "h": 120},
            {"plate": "KA05MB4567", "type": "SEDAN", "color": C_SILVER, "start_x": 130, "start_y": 20, "end_x": 150, "end_y": 340, "start_prog": 0.20, "end_prog": 0.65, "w": 175, "h": 120},
            {"plate": "DL08CD5566", "type": "SEDAN", "color": C_GREY, "start_x": 400, "start_y": 40, "end_x": 410, "end_y": 220, "start_prog": 0.35, "end_prog": 0.90, "w": 180, "h": 120},
            {"plate": "KA02TR5544", "type": "SEDAN", "color": C_BLACK, "start_x": 140, "start_y": 30, "end_x": 160, "end_y": 330, "start_prog": 0.60, "end_prog": 1.00, "w": 175, "h": 120}
        ]
    )

    # 3. Camera 3: Domlur Flyover
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_03_domlur.mp4"),
        camera_name="Domlur Flyover",
        camera_id=3,
        place_name="Domlur",
        gps_coords="12.9609 N, 77.6387 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "DL01AB1234", "type": "SEDAN", "color": C_WHITE, "start_x": 140, "start_y": 25, "end_x": 170, "end_y": 340, "start_prog": 0.05, "end_prog": 0.48, "w": 180, "h": 120},
            {"plate": "TN09BZ9999", "type": "SEDAN", "color": C_RED, "start_x": 390, "start_y": 30, "end_x": 420, "end_y": 340, "start_prog": 0.22, "end_prog": 0.68, "w": 175, "h": 120},
            {"plate": "HR51AK1100", "type": "SUV", "color": C_SILVER, "start_x": 150, "start_y": 20, "end_x": 180, "end_y": 330, "start_prog": 0.45, "end_prog": 0.88, "w": 190, "h": 130},
            {"plate": "KA05MB4567", "type": "SEDAN", "color": C_SILVER, "start_x": 380, "start_y": 20, "end_x": 410, "end_y": 345, "start_prog": 0.65, "end_prog": 1.00, "w": 180, "h": 120}
        ]
    )

    # 4. Camera 4: Koramangala Sony Signal
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_04_koramangala.mp4"),
        camera_name="Koramangala Sony Signal",
        camera_id=4,
        place_name="Koramangala",
        gps_coords="12.9352 N, 77.6245 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "DL01AB1234", "type": "SEDAN", "color": C_WHITE, "start_x": 240, "start_y": 30, "end_x": 270, "end_y": 330, "start_prog": 0.05, "end_prog": 0.48, "w": 180, "h": 120},
            {"plate": "KA04EK9081", "type": "TRUCK", "color": C_YELLOW, "is_commercial": True, "start_x": 120, "start_y": 20, "end_x": 150, "end_y": 330, "start_prog": 0.20, "end_prog": 0.68, "w": 195, "h": 140},
            {"plate": "KA01MJ1122", "type": "HATCHBACK", "color": C_BLUE, "start_x": 390, "start_y": 30, "end_x": 420, "end_y": 340, "start_prog": 0.42, "end_prog": 0.85, "w": 170, "h": 115},
            {"plate": "MH02EE9876", "type": "SEDAN", "color": C_WHITE, "start_x": 230, "start_y": 30, "end_x": 260, "end_y": 335, "start_prog": 0.62, "end_prog": 1.00, "w": 175, "h": 120}
        ]
    )

    # 5. Camera 5: Silk Board Outer Ring
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_05_silk_board.mp4"),
        camera_name="Silk Board Outer Ring",
        camera_id=5,
        place_name="Silk Board",
        gps_coords="12.9176 N, 77.6233 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "MH12DE1433", "type": "SUV", "color": C_BLACK, "start_x": 130, "start_y": 20, "end_x": 160, "end_y": 330, "start_prog": 0.05, "end_prog": 0.50, "w": 190, "h": 130},
            {"plate": "KA53MN8899", "type": "HATCHBACK", "color": C_RED, "start_x": 380, "start_y": 30, "end_x": 410, "end_y": 340, "start_prog": 0.22, "end_prog": 0.66, "w": 165, "h": 115},
            {"plate": "KA04EK9081", "type": "TRUCK", "color": C_YELLOW, "is_commercial": True, "start_x": 140, "start_y": 25, "end_x": 170, "end_y": 330, "start_prog": 0.45, "end_prog": 0.88, "w": 195, "h": 140},
            {"plate": "DL01AB1234", "type": "SEDAN", "color": C_WHITE, "start_x": 390, "start_y": 30, "end_x": 420, "end_y": 335, "start_prog": 0.60, "end_prog": 1.00, "w": 180, "h": 120}
        ]
    )

    # 6. Camera 6: Electronic City Toll Plaza
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_06_electronic_city.mp4"),
        camera_name="Electronic City Toll Plaza",
        camera_id=6,
        place_name="Electronic City",
        gps_coords="12.8452 N, 77.6602 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "KA05MB4567", "type": "SEDAN", "color": C_SILVER, "start_x": 130, "start_y": 15, "end_x": 160, "end_y": 345, "start_prog": 0.05, "end_prog": 0.45, "w": 180, "h": 120},
            {"plate": "KA01MJ1122", "type": "HATCHBACK", "color": C_BLUE, "start_x": 390, "start_y": 25, "end_x": 420, "end_y": 335, "start_prog": 0.20, "end_prog": 0.65, "w": 170, "h": 115},
            {"plate": "KA01BB3344", "type": "SUV", "color": C_GREY, "start_x": 140, "start_y": 30, "end_x": 170, "end_y": 330, "start_prog": 0.42, "end_prog": 0.85, "w": 190, "h": 130},
            {"plate": "DL04CA9090", "type": "SEDAN", "color": C_BLACK, "start_x": 380, "start_y": 20, "end_x": 410, "end_y": 340, "start_prog": 0.60, "end_prog": 1.00, "w": 180, "h": 120}
        ]
    )

    # 7. Camera 7: MG Road South Corridor
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_07_mg_road_south.mp4"),
        camera_name="MG Road South Corridor",
        camera_id=7,
        place_name="MG Road",
        gps_coords="12.9740 N, 77.6075 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "TS07AB4040", "type": "SUV", "color": C_WHITE, "start_x": 380, "start_y": 30, "end_x": 410, "end_y": 340, "start_prog": 0.05, "end_prog": 0.50, "w": 190, "h": 130},
            {"plate": "KA04ZZ1212", "type": "SEDAN", "color": C_BLUE, "start_x": 130, "start_y": 25, "end_x": 160, "end_y": 335, "start_prog": 0.22, "end_prog": 0.68, "w": 175, "h": 120},
            {"plate": "DL01AB1234", "type": "SEDAN", "color": C_WHITE, "start_x": 390, "start_y": 20, "end_x": 420, "end_y": 330, "start_prog": 0.45, "end_prog": 0.88, "w": 180, "h": 120},
            {"plate": "KA03HA4321", "type": "HATCHBACK", "color": C_SILVER, "start_x": 140, "start_y": 30, "end_x": 170, "end_y": 335, "start_prog": 0.62, "end_prog": 1.00, "w": 165, "h": 115}
        ]
    )

    # 8. Camera 8: Koramangala Ring Road Hub
    create_realistic_cctv_video(
        output_path=os.path.join(target_dir, "cam_08_koramangala_hub.mp4"),
        camera_name="Koramangala Ring Road Hub",
        camera_id=8,
        place_name="Koramangala",
        gps_coords="12.9330 N, 77.6260 E",
        duration_sec=9,
        vehicles_data=[
            {"plate": "KA04EK9081", "type": "TRUCK", "color": C_YELLOW, "is_commercial": True, "start_x": 120, "start_y": 20, "end_x": 150, "end_y": 330, "start_prog": 0.05, "end_prog": 0.50, "w": 195, "h": 140},
            {"plate": "KA05QQ8989", "type": "VAN", "color": C_WHITE, "start_x": 380, "start_y": 30, "end_x": 410, "end_y": 340, "start_prog": 0.22, "end_prog": 0.68, "w": 180, "h": 125},
            {"plate": "MH02EE9876", "type": "SEDAN", "color": C_WHITE, "start_x": 140, "start_y": 25, "end_x": 170, "end_y": 330, "start_prog": 0.45, "end_prog": 0.88, "w": 175, "h": 120},
            {"plate": "KA01BB3344", "type": "SUV", "color": C_GREY, "start_x": 390, "start_y": 20, "end_x": 420, "end_y": 335, "start_prog": 0.62, "end_prog": 1.00, "w": 190, "h": 130}
        ]
    )

    print("All 8 demo CCTV videos synthesized into H.264 format successfully!")

if __name__ == "__main__":
    generate_all_demo_videos()
