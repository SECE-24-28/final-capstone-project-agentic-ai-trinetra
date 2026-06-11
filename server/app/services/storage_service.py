"""
Storage Service Module
Handles storing snapshots and video clips for events.
"""

from datetime import datetime

import cv2
import numpy as np
from loguru import logger

from app.config.settings import settings
from app.database.mongodb import get_database


class StorageService:
    """Service for storing and retrieving event evidence."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.snapshot_dir = settings.SNAPSHOT_PATH
        self.clip_dir = settings.CLIP_PATH
        logger.info("Storage service initialized")

    def save_snapshot(
        self, frame: np.ndarray, event_id: str, camera_id: str, zone: str
    ) -> str | None:
        """
        Saves a frame as a JPEG snapshot.
        Returns the path to the saved file.
        """
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"snapshot_{event_id}_{timestamp}.jpg"
            filepath = self.snapshot_dir / filename

            success = cv2.imwrite(str(filepath), frame)
            if not success:
                logger.error(f"Failed to save snapshot for event {event_id}")
                return None

            logger.info(f"Saved snapshot to {filepath} for event {event_id}")
            return str(filepath)
        except Exception as e:
            logger.error(f"Error saving snapshot for event {event_id}: {e}")
            return None

    async def save_evidence_metadata(
        self, event_id: str, snapshot_path: str | None = None, clip_path: str | None = None
    ):
        """Saves evidence metadata to MongoDB."""
        try:
            db = get_database()
            update_data = {"updated_at": datetime.utcnow()}
            if snapshot_path:
                update_data["snapshot_path"] = snapshot_path
            if clip_path:
                update_data["clip_path"] = clip_path

            result = await db["events"].update_one({"event_id": event_id}, {"$set": update_data})
            if result.modified_count > 0:
                logger.info(f"Updated evidence metadata for event {event_id}")
            else:
                logger.warning(f"Event {event_id} not found for metadata update")
        except Exception as e:
            logger.error(f"Error saving evidence metadata for event {event_id}: {e}")


# Singleton instance
storage_service = StorageService()
