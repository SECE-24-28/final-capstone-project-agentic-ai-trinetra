import asyncio

import cv2
import numpy as np

from app.cameras.capture import CameraCapture
from app.detection.event_builder import build_motion_event
from app.detection.mog import MOGDetector


async def test_components():
    print("Testing CameraCapture initialization...")
    _ = CameraCapture("0", "test_cam")
    print("CameraCapture initialized.")

    print("Testing MOGDetector initialization...")
    detector = MOGDetector()
    print("MOGDetector initialized.")

    print("Testing MOGDetector processing...")
    # Create a dummy frame
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(frame, (100, 100), (200, 200), (255, 255, 255), -1)

    fg_mask, contours, movement = detector.apply(frame)
    print(f"Movement detected: {movement}")
    print(f"Number of contours: {len(contours)}")

    print("Testing Event Builder...")
    event = build_motion_event("test_cam", "Sector-1", movement, contours, 1)
    print(f"Event built: {event}")


if __name__ == "__main__":
    asyncio.run(test_components())
