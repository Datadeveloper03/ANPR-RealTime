import os
import sys
import time
import argparse
import logging
from concurrent.futures import ThreadPoolExecutor

# Ensure paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipeline.detector import ANPRDetector
from pipeline.sample_generator import generate_all_demo_videos

logger = logging.getLogger("anpr.processor")

def process_single_camera(detector: ANPRDetector, video_path: str, camera_id: int, frame_interval: int = 10):
    logger.info(f"Processing Camera #{camera_id} from '{video_path}'...")
    count = detector.process_video_file(video_path, camera_id, frame_interval=frame_interval)
    logger.info(f"Camera #{camera_id} complete. Detected {count} valid sightings.")
    return count

def run_multi_camera_simulation(target_dir: str = "pipeline/demo_videos", parallel: bool = False):
    """
    Simulates a city-wide multi-camera network by processing 4 distinct video feeds.
    """
    print("=" * 60)
    print("STARTING CITY-WIDE ANPR MULTI-CAMERA SIMULATION")
    print("=" * 60)

    # 1. Ensure sample clips exist
    if not os.path.exists(target_dir) or len(os.listdir(target_dir)) == 0:
        print("Generating synthesized CCTV footage for 4 cameras...")
        generate_all_demo_videos(target_dir)

    camera_clips = [
        (os.path.join(target_dir, "cam_01_mg_road.mp4"), 1),
        (os.path.join(target_dir, "cam_02_indiranagar.mp4"), 2),
        (os.path.join(target_dir, "cam_03_domlur.mp4"), 3),
        (os.path.join(target_dir, "cam_04_koramangala.mp4"), 4),
    ]

    detector = ANPRDetector()

    if parallel:
        print("Running cameras in parallel threads...")
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(process_single_camera, detector, v_path, c_id, 8)
                for v_path, c_id in camera_clips
            ]
            for f in futures:
                f.result()
    else:
        print("Running cameras sequentially...")
        for v_path, c_id in camera_clips:
            process_single_camera(detector, v_path, c_id, 8)
            time.sleep(1.0)

    print("=" * 60)
    print("SIMULATION COMPLETED - SIGHTINGS INGESTED & ALERTS BROADCASTED")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="City-Wide ANPR Video Feed Processor")
    parser.add_argument("--video", type=str, help="Path to input video file")
    parser.add_argument("--camera_id", type=int, default=1, help="Camera ID (default: 1)")
    parser.add_argument("--interval", type=int, default=10, help="Frame sample interval (default: 10)")
    parser.add_argument("--simulate_all", action="store_true", help="Run 4-camera simulation network")
    parser.add_argument("--parallel", action="store_true", help="Run simulation in parallel threads")

    args = parser.parse_args()

    if args.simulate_all or not args.video:
        run_multi_camera_simulation(parallel=args.parallel)
    else:
        detector = ANPRDetector()
        process_single_camera(detector, args.video, args.camera_id, frame_interval=args.interval)
