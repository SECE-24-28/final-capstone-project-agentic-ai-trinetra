"""
Event Builder Module
Converts MOG + YOLO + Tracking results into structured events with
deduplication and threat categorization.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from loguru import logger

from app.config.settings import settings
from app.schemas.detection import (
    EventStatus,
    FusionEvent,
    FutureAIPayload,
    ThreatCategory,
    TrackedObject,
)

VEHICLE_CLASSES = {"car", "truck", "motorcycle", "bus", "bicycle"}
PERSON_CLASS = "person"


class EventBuilder:
    """
    Builds structured fusion events from detection pipeline results.
    Handles deduplication, threat categorization, and confidence calculation.
    """

    def __init__(self):
        self.last_event_time: dict[str, datetime] = {}  # camera_id -> last event timestamp

    def _calculate_threat_category(
        self, tracked_objects: list[dict[str, Any]], movement: bool
    ) -> ThreatCategory:
        """
        Determines threat category based on tracked objects and movement.
        """
        if not movement:
            return ThreatCategory.NO_ACTIVITY

        if not tracked_objects:
            return ThreatCategory.MOVEMENT_ONLY

        persons = [obj for obj in tracked_objects if obj["type"] == PERSON_CLASS]
        vehicles = [obj for obj in tracked_objects if obj["type"] in VEHICLE_CLASSES]

        if persons and vehicles:
            return ThreatCategory.PERSON_AND_VEHICLE
        elif len(persons) > 1:
            return ThreatCategory.MULTIPLE_PERSONS
        elif persons:
            return ThreatCategory.PERSON_DETECTED
        elif vehicles:
            return ThreatCategory.VEHICLE_DETECTED
        else:
            return ThreatCategory.UNKNOWN_OBJECT

    def _calculate_confidence(self, tracked_objects: list[dict[str, Any]], movement: bool) -> float:
        """
        Calculates combined confidence score from YOLO detections + movement.
        """
        if not movement:
            return 0.0

        if not tracked_objects:
            return 0.5  # Only movement detected

        # Average confidence of tracked objects
        avg_conf = sum(obj["confidence"] for obj in tracked_objects) / len(tracked_objects)

        # Boost confidence slightly for multiple objects
        object_boost = min(0.1, len(tracked_objects) * 0.05)

        return min(1.0, avg_conf + object_boost)

    def _is_duplicate(self, camera_id: str, current_time: datetime) -> bool:
        """
        Checks if an event is a duplicate (within cooldown period).
        """
        if camera_id not in self.last_event_time:
            return False

        time_since_last = (current_time - self.last_event_time[camera_id]).total_seconds()
        return time_since_last < settings.EVENT_COOLDOWN_SECONDS

    def build_future_ai_payload(self, event: FusionEvent) -> FutureAIPayload:
        """
        Builds payload structure for future Groq API integration.
        """
        object_types = [obj.type for obj in event.objects]

        return FutureAIPayload(
            camera=event.camera_id,
            zone=event.zone,
            timestamp=event.timestamp.isoformat(),
            objects=object_types,
            count=len(object_types),
            movement=event.movement,
            confidence=event.confidence,
        )

    def build_event(
        self,
        camera_id: str,
        zone: str,
        movement: bool,
        tracked_objects: list[dict[str, Any]],
        yolo_detections: list[dict[str, Any]] | None = None,
    ) -> FusionEvent | None:
        """
        Builds a FusionEvent from pipeline results.
        Returns None if event is a duplicate or no significant activity.
        """
        current_time = datetime.now(UTC)

        # Calculate threat category
        threat_category = self._calculate_threat_category(tracked_objects, movement)

        # Skip if no activity
        if threat_category == ThreatCategory.NO_ACTIVITY:
            return None

        # Check for duplicates
        if self._is_duplicate(camera_id, current_time):
            logger.debug(f"[{camera_id}] Event deduplicated, skipping")
            return None

        # Calculate combined confidence
        confidence = self._calculate_confidence(tracked_objects, movement)

        # Convert tracked objects to Pydantic models
        tracked_objs = [
            TrackedObject(
                type=obj["type"],
                confidence=obj["confidence"],
                tracking_id=obj["tracking_id"],
                bbox=obj.get("bbox"),
            )
            for obj in tracked_objects
        ]

        # Create event
        event = FusionEvent(
            event_id=str(uuid.uuid4()),
            camera_id=camera_id,
            zone=zone,
            timestamp=current_time,
            movement=movement,
            objects=tracked_objs,
            confidence=confidence,
            threat_category=threat_category,
            status=EventStatus.PENDING_AI,
        )

        # Update last event time for deduplication
        self.last_event_time[camera_id] = current_time

        logger.info(
            f"[{camera_id}] Event created: {threat_category.value}, confidence: {confidence:.2f}"
        )

        return event


# Create singleton instance
event_builder = EventBuilder()
