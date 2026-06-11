"""
Camera Service Module
Handles database operations for camera management.
"""

from datetime import datetime

from loguru import logger

from app.database.mongodb import get_database
from app.schemas.camera import Camera, CameraCreate, CameraStatus, CameraUpdate


class CameraService:
    """Service for managing cameras in the database."""

    COLLECTION_NAME = "cameras"

    @classmethod
    async def create_camera(cls, camera: CameraCreate) -> Camera:
        """Creates a new camera in the database."""
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            # Generate a human-readable ID
            count = await collection.count_documents({})
            camera_id = f"cam_{count + 1:03d}"

            now = datetime.utcnow()
            camera_dict = camera.model_dump()
            camera_dict.update(
                {
                    "id": camera_id,
                    "status": CameraStatus.UNKNOWN,
                    "fps": None,
                    "last_heartbeat": None,
                    "created_at": now,
                    "updated_at": now,
                }
            )

            result = await collection.insert_one(camera_dict)
            logger.info(f"Created camera {camera_id} with mongo ID {result.inserted_id}")

            return Camera(**camera_dict)
        except Exception as e:
            logger.error(f"Failed to create camera: {e}")
            raise

    @classmethod
    async def get_camera(cls, camera_id: str) -> Camera | None:
        """Retrieves a camera by its ID."""
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            doc = await collection.find_one({"id": camera_id})
            if doc:
                return Camera(**doc)
            return None
        except Exception as e:
            logger.error(f"Failed to get camera {camera_id}: {e}")
            raise

    @classmethod
    async def list_cameras(cls, skip: int = 0, limit: int = 100) -> list[Camera]:
        """Lists all cameras with pagination."""
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            cursor = collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
            cameras = []
            async for doc in cursor:
                cameras.append(Camera(**doc))

            return cameras
        except Exception as e:
            logger.error(f"Failed to list cameras: {e}")
            raise

    @classmethod
    async def update_camera(cls, camera_id: str, camera_update: CameraUpdate) -> Camera | None:
        """Updates an existing camera."""
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            update_data = camera_update.model_dump(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.utcnow()

                result = await collection.update_one({"id": camera_id}, {"$set": update_data})

                if result.modified_count > 0:
                    return await cls.get_camera(camera_id)

            return None
        except Exception as e:
            logger.error(f"Failed to update camera {camera_id}: {e}")
            raise

    @classmethod
    async def delete_camera(cls, camera_id: str) -> bool:
        """Deletes a camera from the database."""
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            result = await collection.delete_one({"id": camera_id})
            success = result.deleted_count > 0

            if success:
                logger.info(f"Deleted camera {camera_id}")

            return success
        except Exception as e:
            logger.error(f"Failed to delete camera {camera_id}: {e}")
            raise

    @classmethod
    async def update_heartbeat(cls, camera_id: str, fps: float | None = None) -> bool:
        """Updates camera heartbeat and optionally FPS."""
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            update_data = {
                "last_heartbeat": datetime.utcnow(),
                "status": CameraStatus.ONLINE,
                "updated_at": datetime.utcnow(),
            }

            if fps is not None:
                update_data["fps"] = fps

            result = await collection.update_one({"id": camera_id}, {"$set": update_data})

            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Failed to update heartbeat for camera {camera_id}: {e}")
            return False


# Singleton instance
camera_service = CameraService()
