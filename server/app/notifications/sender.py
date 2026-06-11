"""
Notification Sender Module
Builds and sends notifications with retries.
"""

import asyncio

from loguru import logger

from app.schemas.detection import (
    AIReasoningResult,
    FusionEvent,
    NotificationPayload,
    ThreatCategory,
    ThreatLevel,
)


class NotificationSender:
    """Builds and sends notifications."""

    _instance = None
    MAX_RETRIES = 3

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def build_payload(
        self, event: FusionEvent, ai_result: AIReasoningResult | None = None
    ) -> NotificationPayload:
        """
        Builds notification payload from event and AI analysis.

        Args:
            event: FusionEvent
            ai_result: Optional AI analysis

        Returns:
            NotificationPayload
        """
        # Determine priority
        if ai_result:
            priority = ai_result.threat_level
        else:
            priority = self._category_to_priority(event.threat_category)

        # Build message
        message = self._build_message(event, ai_result)

        payload = NotificationPayload(
            priority=priority,
            zone=event.zone,
            camera_id=event.camera_id,
            message=message,
            event_id=event.event_id,
            threat_category=event.threat_category,
            recommended_action=ai_result.recommended_action if ai_result else "Monitor situation",
        )

        logger.info(f"Notification payload built - event_id: {event.event_id}")
        return payload

    def _category_to_priority(self, category: ThreatCategory) -> ThreatLevel:
        """Maps threat category to priority level."""
        mapping = {
            ThreatCategory.NO_ACTIVITY: ThreatLevel.LOW,
            ThreatCategory.MOVEMENT_ONLY: ThreatLevel.LOW,
            ThreatCategory.PERSON_DETECTED: ThreatLevel.MEDIUM,
            ThreatCategory.MULTIPLE_PERSONS: ThreatLevel.HIGH,
            ThreatCategory.VEHICLE_DETECTED: ThreatLevel.MEDIUM,
            ThreatCategory.PERSON_AND_VEHICLE: ThreatLevel.HIGH,
            ThreatCategory.UNKNOWN_OBJECT: ThreatLevel.MEDIUM,
        }
        return mapping.get(category, ThreatLevel.LOW)

    def _build_message(self, event: FusionEvent, ai_result: AIReasoningResult | None) -> str:
        """Builds human-readable message."""
        object_list = ", ".join([obj.type for obj in event.objects]) if event.objects else "unknown"

        if ai_result:
            return ai_result.command_message

        return (
            f"{event.threat_category.value.replace('_', ' ').title()} at {event.zone} "
            f"(Camera: {event.camera_id}) - Objects: {object_list}"
        )

    async def send_with_retry(self, payload: NotificationPayload, send_func) -> bool:
        """
        Sends notification with retries.

        Args:
            payload: Notification to send
            send_func: Async function to execute send

        Returns:
            True if successful
        """
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                await send_func(payload)
                logger.info(
                    f"Notification sent successfully - event_id: {payload.event_id}, "
                    f"attempt: {attempt}"
                )
                return True
            except Exception as e:
                logger.error(
                    f"Notification send failed - event_id: {payload.event_id}, "
                    f"attempt: {attempt}, error: {e}"
                )
                if attempt < self.MAX_RETRIES:
                    wait_time = 2**attempt  # Exponential backoff
                    await asyncio.sleep(wait_time)

        logger.error(f"All notification attempts failed - event_id: {payload.event_id}")
        return False


# Singleton instance
notification_sender = NotificationSender()
