"""
Camera Capture Module
Handles frame acquisition from various sources (RTSP, webcam, files) using OpenCV.
"""

import cv2
import numpy as np
from loguru import logger


class CameraCapture:
    """
    Responsible for acquiring frames from a video source.
    Handles automatic reconnection and resource management.
    """

    def __init__(self, stream_url: str, camera_id: str):
        self.stream_url = stream_url
        self.camera_id = camera_id
        self.cap: cv2.VideoCapture | None = None
        self.is_connected = False
        self.reconnect_interval = 5  # seconds

    def connect(self) -> bool:
        """
        Attempts to connect to the video source.
        """
        try:
            if self.cap is not None:
                self.cap.release()

            self.cap = cv2.VideoCapture(self.stream_url)
            if self.cap.isOpened():
                self.is_connected = True
                logger.info(f"Camera {self.camera_id}: Connected to {self.stream_url}")
                return True
            else:
                self.is_connected = False
                logger.error(f"Camera {self.camera_id}: Failed to open stream {self.stream_url}")
                return False
        except Exception as e:
            self.is_connected = False
            logger.error(f"Camera {self.camera_id}: Connection error: {e}")
            return False

    def read_frame(self) -> np.ndarray | None:
        """
        Reads a single frame from the source.
        Handles automatic reconnection if the stream is lost.
        """
        if not self.is_connected or self.cap is None:
            if not self.connect():
                return None

        try:
            ret, frame = self.cap.read()
            if not ret:
                logger.warning(f"Camera {self.camera_id}: Stream lost, attempting to reconnect...")
                self.is_connected = False
                return None
            return frame
        except Exception as e:
            logger.error(f"Camera {self.camera_id}: Error reading frame: {e}")
            self.is_connected = False
            return None

    def release(self):
        """
        Releases the video capture resources.
        """
        if self.cap:
            self.cap.release()
            self.cap = None
            self.is_connected = False
            logger.info(f"Camera {self.camera_id}: Resources released")
