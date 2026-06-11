"""
Camera Schemas
Pydantic models for camera operations.
"""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class CameraStatus(StrEnum):
    """Camera operational status."""

    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    UNKNOWN = "unknown"


class CameraBase(BaseModel):
    """Base camera model with shared fields."""

    name: str = Field(..., description="Human-readable camera name")
    zone: str = Field(..., description="Zone where camera is located")
    stream_url: str = Field(..., description="URL to camera stream")


class CameraCreate(CameraBase):
    """Model for creating a new camera."""

    pass


class CameraUpdate(BaseModel):
    """Model for updating an existing camera."""

    name: str | None = None
    zone: str | None = None
    stream_url: str | None = None
    status: CameraStatus | None = None


class Camera(CameraBase):
    """Complete camera model with all fields."""

    id: str = Field(..., description="Unique camera identifier")
    status: CameraStatus = Field(
        default=CameraStatus.UNKNOWN, description="Current operational status"
    )
    fps: float | None = Field(default=None, description="Current frames per second")
    last_heartbeat: datetime | None = Field(
        default=None, description="Last time camera sent heartbeat"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "cam_001",
                "name": "North Gate Camera",
                "zone": "Sector A",
                "stream_url": "rtsp://192.168.1.100:554/stream1",
                "status": "online",
                "fps": 30.0,
                "last_heartbeat": "2024-01-01T12:00:00Z",
            }
        }
