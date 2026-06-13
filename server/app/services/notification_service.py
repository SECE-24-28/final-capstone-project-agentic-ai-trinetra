"""
Notification Service Module
Orchestrates the complete event pipeline.
"""

from loguru import logger

from app.ai.service import ai_service
from app.notifications.dispatcher import notification_dispatcher
from app.notifications.sender import notification_sender
from app.notifications.websocket import websocket_manager
from app.schemas.detection import EventStatus, FusionEvent, ThreatLevel, AIReasoningResult
from app.services.event_service import event_service
from app.services.threat_service import threat_service


class NotificationService:
    """
    Orchestrates the complete event pipeline:
    Event → AI Analysis → Threat Assessment → Notification → Dispatch
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def process_event(self, event: FusionEvent):
        """
        Processes an event through the complete pipeline.

        Args:
            event: FusionEvent to process
        """
        event_id = event.event_id
        logger.info(f"Starting event processing - event_id: {event_id}")

        try:
            # 1. Save event with CREATED status
            await event_service.save_event(event)

            # 2. Update to PROCESSING status
            await event_service.update_status(event_id, EventStatus.PROCESSING)

            # 3. AI Analysis (fallback if AI is not available)
            logger.info(f"Starting AI analysis - event_id: {event_id}")
            ai_result = await ai_service.analyze_event(event)

            if ai_result is None:
                # Fallback to basic analysis if AI isn't available
                logger.warning(
                    f"Groq inference unavailable, using fallback analysis - event_id: {event_id}"
                )
                ai_result = AIReasoningResult(
                    summary=f"Event detected in zone {event.zone} with {'movement' if event.movement else 'objects'}: {[obj.type for obj in event.objects]}",
                    threat_level=ThreatLevel.LOW if not event.objects else ThreatLevel.MEDIUM,
                    recommended_action="Monitor the area",
                    confidence=0.5,
                    soldier_message="Check your surroundings",
                    command_message="Review the alert",
                )

            # 4. Update to AI_ANALYZED status
            await event_service.update_status(event_id, EventStatus.AI_ANALYZED, ai_result)

            # 5. Threat Assessment
            logger.info(f"Starting threat assessment - event_id: {event_id}")
            decision_level = threat_service.assess_threat(event, ai_result)
            logger.info(
                f"Threat assessment complete - event_id: {event_id}, "
                f"decision: {decision_level.value}"
            )

            # 6. Build notification payload
            payload = notification_sender.build_payload(event, ai_result)

            # 7. Dispatch notification
            _ = notification_dispatcher.dispatch(payload)

            # 8. Send notification via WebSocket
            send_success = await notification_sender.send_with_retry(
                payload, websocket_manager.broadcast
            )

            # 9. Update to NOTIFIED status if successful
            if send_success:
                await event_service.update_status(event_id, EventStatus.NOTIFIED)
                logger.info(
                    f"Event processing complete - event_id: {event_id}, "
                    f"status: {EventStatus.NOTIFIED.value}"
                )
            else:
                logger.warning(
                    f"Event processing complete with notification failure - event_id: {event_id}"
                )

        except Exception as e:
            logger.error(
                f"Event processing failed - event_id: {event_id}, error: {e}", exc_info=True
            )

    async def process_pending_events(self):
        """
        Processes all pending events from the database.
        """
        try:
            pending_events = await event_service.get_pending_ai_events()
            if not pending_events:
                logger.debug("No pending events to process")
                return

            logger.info(f"Processing {len(pending_events)} pending events")

            for event_doc in pending_events:
                # Convert EventDocument back to FusionEvent
                event = FusionEvent(
                    event_id=event_doc.event_id,
                    camera_id=event_doc.camera_id,
                    zone=event_doc.zone,
                    timestamp=event_doc.timestamp,
                    movement=event_doc.movement,
                    objects=event_doc.objects,
                    confidence=event_doc.confidence,
                    threat_category=event_doc.threat_category,
                    status=event_doc.status,
                )
                await self.process_event(event)

        except Exception as e:
            logger.error(f"Failed to process pending events: {e}", exc_info=True)


# Singleton instance
notification_service = NotificationService()
