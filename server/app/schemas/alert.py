"""
Alert Schemas
Pydantic models for alert and event operations.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.detection import EventStatus, ThreatCategory, ThreatLevel


class TrackedObject(BaseModel):
    """Tracked object in an event."""

    type: str
    confidence: float
    tracking_id: int


class Event(BaseModel):
    """Complete event model."""

    id: str = Field(..., description="Unique event identifier (alias of event_id)")
    event_id: str = Field(..., description="Unique event identifier")
    camera_id: str = Field(..., description="Camera that generated the event")
    zone: str = Field(..., description="Zone where event occurred")
    timestamp: datetime = Field(..., description="When event occurred")
    movement: bool = Field(default=False, description="Whether movement was detected")
    objects: list[TrackedObject] = Field(default_factory=list, description="Detected objects")
    confidence: float = Field(default=0.0, description="Overall confidence score")
    threat_category: ThreatCategory | None = Field(
        default=None, description="Rule-based threat category"
    )
    threat_level: ThreatLevel | None = Field(default=None, description="AI-derived threat level")
    ai_summary: str | None = Field(default=None, description="AI-generated situation summary")
    recommended_action: str | None = Field(default=None, description="AI-recommended action")
    status: EventStatus = Field(default=EventStatus.CREATED, description="Current event status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Alert(Event):
    """Alert model (alias of Event with additional metadata)."""

    priority: ThreatLevel = Field(default=ThreatLevel.LOW, description="Alert priority level")


class PaginationParams(BaseModel):
    """Pagination query parameters."""

    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=50, ge=1, le=200, description="Maximum number of items to return")


class EventFilterParams(BaseModel):
    """Filter parameters for event queries."""

    zone: str | None = Field(default=None, description="Filter by zone")
    threat_level: ThreatLevel | None = Field(default=None, description="Filter by threat level")
    status: EventStatus | None = Field(default=None, description="Filter by status")
    start_time: datetime | None = Field(default=None, description="Filter events after this time")
    end_time: datetime | None = Field(default=None, description="Filter events before this time")
