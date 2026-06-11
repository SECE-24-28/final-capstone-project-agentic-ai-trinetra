"""
Database Models
Data structure definitions for MongoDB collections.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.alert import EventStatus
from app.schemas.detection import ThreatCategory, ThreatLevel, TrackedObject


class EventDocument(BaseModel):
    """
    MongoDB document schema for events with full lifecycle.
    """

    event_id: str
    camera_id: str
    zone: str
    timestamp: datetime
    movement: bool
    objects: list[TrackedObject]
    confidence: float
    threat_category: ThreatCategory | None = None
    status: EventStatus = EventStatus.CREATED
    threat_level: ThreatLevel | None = None
    ai_summary: str | None = None
    recommended_action: str | None = None
    ai_analysis: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "camera_id": "cam-001",
                "zone": "East Border",
                "timestamp": "2024-01-01T12:00:00Z",
                "movement": True,
                "objects": [{"type": "person", "confidence": 0.92, "tracking_id": 1}],
                "confidence": 0.92,
                "threat_category": "PERSON_DETECTED",
                "status": "ai_analyzed",
                "threat_level": "LOW",
                "ai_summary": "Single person detected near East Border",
                "recommended_action": "Monitor situation",
            }
        }
