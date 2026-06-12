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
from app.detection.pipeline import DetectionPipeline
from app.detection.event_builder import event_builder
from app.services.notification_service import notification_service
from app.config.settings import settings


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
        self.detection_pipeline = DetectionPipeline()
        self.latest_frame: np.ndarray | None = None
        self.last_frame_time: datetime | None = None
        self.fps = 0.0
        self.resolution = (0, 0)
        self.is_running = False
        self.dropped_frames = 0
        self.task: asyncio.Task | None = None
        self.last_event_time: float = 0  # Track last event time for cooldown

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
        Background loop for continuous frame reading and processing.
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

                # Run detection pipeline less frequently and with cooldown
                if frame_count % 10 == 0:  # Process every 10th frame
                    try:
                        movement_detected, yolo_detections, tracked_objects, fg_mask = (
                            self.detection_pipeline.process_frame(
                                frame, self.camera_id, self.zone
                            )
                        )

                        # Build event if movement/objects detected and cooldown passed
                        if (movement_detected or tracked_objects) and (
                            time.time() - self.last_event_time > settings.EVENT_COOLDOWN_SECONDS
                        ):
                            event = event_builder.build_event(
                                self.camera_id,
                                self.zone,
                                movement_detected,
                                tracked_objects,
                                yolo_detections,
                            )
                            if event:
                                # Send to notification service for processing
                                asyncio.create_task(notification_service.process_event(event))
                                self.last_event_time = time.time()
                    except Exception as e:
                        logger.error(f"Error processing frame: {e}", exc_info=True)
            else:
                self.dropped_frames += 1
                await asyncio.sleep(1)  # Wait before retry if frame acquisition fails

            await asyncio.sleep(0.03)  # Reduce CPU load a bit

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
