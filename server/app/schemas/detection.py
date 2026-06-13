"""
Detection Schemas
Pydantic models for detection and event data structures.
"""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class BoundingBox(BaseModel):
    """Bounding box coordinates for detected objects."""

    x1: int
    y1: int
    x2: int
    y2: int


class Detection(BaseModel):
    """Single object detection result from YOLO."""

    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox


class TrackedObject(BaseModel):
    """Tracked object with ID and persistence info."""

    type: str
    confidence: float
    tracking_id: int
    bbox: BoundingBox | None = None


class ThreatCategory(StrEnum):
    """Rule-based threat categories."""

    NO_ACTIVITY = "NO_ACTIVITY"
    MOVEMENT_ONLY = "MOVEMENT_ONLY"
    PERSON_DETECTED = "PERSON_DETECTED"
    MULTIPLE_PERSONS = "MULTIPLE_PERSONS"
    VEHICLE_DETECTED = "VEHICLE_DETECTED"
    PERSON_AND_VEHICLE = "PERSON_AND_VEHICLE"
    UNKNOWN_OBJECT = "UNKNOWN_OBJECT"


class ThreatLevel(StrEnum):
    """AI-derived threat levels."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EventStatus(StrEnum):
    """Event lifecycle statuses."""

    CREATED = "created"
    MOTION_DETECTED = "motion_detected"
    YOLO_ANALYZED = "yolo_analyzed"
    PROCESSING = "processing"
    AI_ANALYZED = "ai_analyzed"
    NOTIFIED = "notified"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AIReasoningResult(BaseModel):
    """Structured AI analysis output."""

    summary: str
    threat_level: ThreatLevel
    recommended_action: str
    confidence: float
    soldier_message: str
    command_message: str


class NotificationPayload(BaseModel):
    """Payload for notifications."""

    priority: ThreatLevel
    zone: str
    camera_id: str
    message: str
    event_id: str
    threat_category: ThreatCategory
    recommended_action: str
    analysis_source: str = "fallback"


class FusionEvent(BaseModel):
    """Combined event from MOG + YOLO + Tracking."""

    event_id: str
    camera_id: str
    zone: str
    timestamp: datetime
    movement: bool
    objects: list[TrackedObject]
    confidence: float
    threat_category: ThreatCategory | None = None
    status: EventStatus = EventStatus.CREATED


class FutureAIPayload(BaseModel):
    """Payload structure for future Groq API integration."""

    camera: str
    zone: str
    timestamp: str
    objects: list[str]
    count: int
    movement: bool
    confidence: float


class MotionContour(BaseModel):
    """Motion contour bounding box."""

    x: int
    y: int
    width: int
    height: int


class MotionEvent(BaseModel):
    """Motion detection event from MOG."""

    camera_id: str
    zone: str
    timestamp: str
    movement_detected: bool
    bounding_boxes: list[MotionContour]
    frame_id: int | None = None
