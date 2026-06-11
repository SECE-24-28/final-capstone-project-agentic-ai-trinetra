"""
Camera Manager Module
Coordinates all active camera streams, providing a centralized management interface.
"""

from typing import Any

from loguru import logger

from app.cameras.stream import CameraStream


class CameraManager:
    """
    Registry and manager for multiple camera streams.
    """

    def __init__(self):
        self.streams: dict[str, CameraStream] = {}

    async def register_camera(self, camera_config: dict[str, Any]):
        """
        Creates and registers a new camera stream.
        """
        camera_id = camera_config["camera_id"]
        if camera_id in self.streams:
            logger.warning(f"Camera {camera_id} is already registered")
            return

        stream = CameraStream(camera_config)
        self.streams[camera_id] = stream
        logger.info(f"Camera {camera_id} registered")

        if camera_config.get("enabled", True):
            await stream.start()

    async def remove_camera(self, camera_id: str):
        """
        Stops and removes a camera stream.
        """
        if camera_id not in self.streams:
            logger.warning(f"Camera {camera_id} not found")
            return

        stream = self.streams[camera_id]
        await stream.stop()
        del self.streams[camera_id]
        logger.info(f"Camera {camera_id} removed")

    async def start_camera(self, camera_id: str):
        """
        Starts a specific camera stream.
        """
        if camera_id in self.streams:
            await self.streams[camera_id].start()

    async def stop_camera(self, camera_id: str):
        """
        Stops a specific camera stream.
        """
        if camera_id in self.streams:
            await self.streams[camera_id].stop()

    async def restart_camera(self, camera_id: str):
        """
        Restarts a specific camera stream.
        """
        if camera_id in self.streams:
            await self.streams[camera_id].restart()

    def list_cameras(self) -> list[dict[str, Any]]:
        """
        Returns a list of all registered cameras and their statuses.
        """
        return [stream.get_status() for stream in self.streams.values()]

    def get_camera_status(self, camera_id: str) -> dict[str, Any] | None:
        """
        Returns the status of a specific camera.
        """
        if camera_id in self.streams:
            return self.streams[camera_id].get_status()
        return None

    def get_stream(self, camera_id: str) -> CameraStream | None:
        """
        Returns the CameraStream object for a given ID.
        """
        return self.streams.get(camera_id)

    async def shutdown(self):
        """
        Stops all active streams.
        """
        logger.info("Shutting down all camera streams...")
        for stream in self.streams.values():
            await stream.stop()
        self.streams.clear()


# Singleton instance
camera_manager = CameraManager()
