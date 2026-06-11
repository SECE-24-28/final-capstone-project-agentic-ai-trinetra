"""
Camera Stream Module
Wraps a camera session, managing continuous frame acquisition and status tracking.
"""

import asyncio
import time
from datetime import datetime
from typing import Any

import numpy as np
from loguru import logger

from app.cameras.capture import CameraCapture


class CameraStream:
    """
    Manages a single camera stream, including metadata, status, and frame buffering.
    """

    def __init__(self, camera_config: dict[str, Any]):
        self.camera_id = camera_config["camera_id"]
        self.name = camera_config["name"]
        self.zone = camera_config["zone"]
        self.location = camera_config["location"]
        self.stream_url = camera_config["stream_url"]
        self.enabled = camera_config.get("enabled", True)

        self.capture = CameraCapture(self.stream_url, self.camera_id)
        self.latest_frame: np.ndarray | None = None
        self.last_frame_time: datetime | None = None
        self.fps = 0.0
        self.resolution = (0, 0)
        self.is_running = False
        self.dropped_frames = 0
        self.task: asyncio.Task | None = None

    async def start(self):
        """
        Starts the background task for frame acquisition.
        """
        if self.is_running:
            logger.warning(f"Stream {self.camera_id} is already running")
            return

        if not self.enabled:
            logger.warning(f"Stream {self.camera_id} is disabled, cannot start")
            return

        self.is_running = True
        self.task = asyncio.create_task(self._run())
        logger.info(f"Stream {self.camera_id} started")

    async def stop(self):
        """
        Stops the background task and releases resources.
        """
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None

        self.capture.release()
        logger.info(f"Stream {self.camera_id} stopped")

    async def restart(self):
        """
        Restarts the stream.
        """
        await self.stop()
        await self.start()

    async def _run(self):
        """
        Background loop for continuous frame reading.
        """
        frame_count = 0
        start_time = time.time()

        while self.is_running:
            frame = self.capture.read_frame()
            if frame is not None:
                self.latest_frame = frame
                self.last_frame_time = datetime.now()
                frame_count += 1

                # Update resolution if not set
                if self.resolution == (0, 0):
                    h, w = frame.shape[:2]
                    self.resolution = (w, h)

                # Update FPS every 30 frames
                if frame_count % 30 == 0:
                    end_time = time.time()
                    self.fps = 30 / (end_time - start_time)
                    start_time = end_time
            else:
                self.dropped_frames += 1
                await asyncio.sleep(1)  # Wait before retry if frame acquisition fails

            await asyncio.sleep(0.01)  # Prevent CPU hogging

    def get_status(self) -> dict[str, Any]:
        """
        Returns the current status of the stream.
        """
        return {
            "camera_id": self.camera_id,
            "name": self.name,
            "zone": self.zone,
            "location": self.location,
            "status": "online" if self.capture.is_connected else "offline",
            "fps": round(self.fps, 2),
            "resolution": f"{self.resolution[0]}x{self.resolution[1]}",
            "last_frame": self.last_frame_time.isoformat() if self.last_frame_time else None,
            "dropped_frames": self.dropped_frames,
            "enabled": self.enabled,
        }
