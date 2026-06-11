"""
Cameras Router
API endpoints for camera management operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.auth.dependencies import require_permission
from app.auth.permissions import Permission
from app.schemas.camera import Camera, CameraCreate, CameraUpdate
from app.schemas.user import UserInDB
from app.services.camera_service import camera_service

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("", response_model=list[Camera], summary="List all cameras")
async def list_cameras(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of items to return"),
    current_user: UserInDB = Depends(require_permission(Permission.READ_CAMERAS)),
):
    """Lists all registered cameras with pagination."""
    try:
        cameras = await camera_service.list_cameras(skip, limit)
        logger.info(f"User {current_user.username} listed {len(cameras)} cameras")
        return cameras
    except Exception as e:
        logger.error(f"Failed to list cameras: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list cameras"
        ) from e


@router.get("/{camera_id}", response_model=Camera, summary="Get a camera by ID")
async def get_camera(
    camera_id: str, current_user: UserInDB = Depends(require_permission(Permission.READ_CAMERAS))
):
    """Retrieves a specific camera by its ID."""
    try:
        camera = await camera_service.get_camera(camera_id)
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Camera {camera_id} not found"
            )
        return camera
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get camera {camera_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve camera"
        ) from e


@router.post(
    "", response_model=Camera, status_code=status.HTTP_201_CREATED, summary="Create a new camera"
)
async def create_camera(
    camera: CameraCreate,
    current_user: UserInDB = Depends(require_permission(Permission.WRITE_CAMERAS)),
):
    """Creates a new camera and registers it in the database."""
    try:
        new_camera = await camera_service.create_camera(camera)
        logger.info(f"User {current_user.username} created camera {new_camera.id}")
        return new_camera
    except Exception as e:
        logger.error(f"Failed to create camera: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create camera"
        ) from e


@router.put("/{camera_id}", response_model=Camera, summary="Update an existing camera")
async def update_camera(
    camera_id: str,
    camera_update: CameraUpdate,
    current_user: UserInDB = Depends(require_permission(Permission.WRITE_CAMERAS)),
):
    """Updates an existing camera's configuration."""
    try:
        updated_camera = await camera_service.update_camera(camera_id, camera_update)
        if not updated_camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Camera {camera_id} not found"
            )
        logger.info(f"User {current_user.username} updated camera {camera_id}")
        return updated_camera
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update camera {camera_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update camera"
        ) from e


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a camera")
async def delete_camera(
    camera_id: str, current_user: UserInDB = Depends(require_permission(Permission.DELETE_CAMERAS))
):
    """Deletes a camera from the database."""
    try:
        success = await camera_service.delete_camera(camera_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Camera {camera_id} not found"
            )
        logger.info(f"User {current_user.username} deleted camera {camera_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete camera {camera_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete camera"
        ) from e
