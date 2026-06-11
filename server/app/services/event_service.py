"""
Event Service Module
Manages event lifecycle and persistence.
"""

from datetime import datetime

from loguru import logger

from app.database.models import EventDocument
from app.database.mongodb import get_database
from app.schemas.alert import EventStatus
from app.schemas.detection import AIReasoningResult, FusionEvent


class EventService:
    """
    Service for managing events in the database.
    """

    COLLECTION_NAME = "events"

    @classmethod
    async def save_event(cls, event: FusionEvent) -> str:
        """
        Saves a FusionEvent to MongoDB with CREATED status.

        Args:
            event: FusionEvent to save

        Returns:
            Inserted document ID
        """
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            event_doc = EventDocument(
                event_id=event.event_id,
                camera_id=event.camera_id,
                zone=event.zone,
                timestamp=event.timestamp,
                movement=event.movement,
                objects=event.objects,
                confidence=event.confidence,
                threat_category=event.threat_category,
                status=EventStatus.CREATED,
            )

            result = await collection.insert_one(event_doc.model_dump())
            logger.info(
                f"Event saved to database - event_id: {event.event_id}, "
                f"status: {EventStatus.CREATED.value}, "
                f"mongo_id: {result.inserted_id}"
            )
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Failed to save event {event.event_id}: {e}")
            raise

    @classmethod
    async def update_status(
        cls, event_id: str, new_status: EventStatus, ai_result: AIReasoningResult | None = None
    ) -> bool:
        """
        Updates event status and optionally adds AI analysis.

        Args:
            event_id: Event identifier
            new_status: New event status
            ai_result: Optional AI analysis result

        Returns:
            True if updated successfully
        """
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            update_data = {"status": new_status.value, "updated_at": datetime.utcnow()}

            if ai_result:
                update_data.update(
                    {
                        "threat_level": ai_result.threat_level.value,
                        "ai_summary": ai_result.summary,
                        "recommended_action": ai_result.recommended_action,
                        "ai_analysis": ai_result.model_dump_json(),
                    }
                )

            result = await collection.update_one({"event_id": event_id}, {"$set": update_data})

            success = result.modified_count > 0
            if success:
                logger.info(
                    f"Event status updated - event_id: {event_id}, new_status: {new_status.value}"
                )
            else:
                logger.warning(f"Event not found for update: {event_id}")

            return success

        except Exception as e:
            logger.error(f"Failed to update event {event_id}: {e}")
            raise

    @classmethod
    async def get_event_by_id(cls, event_id: str) -> EventDocument | None:
        """
        Retrieves an event by its event_id.

        Args:
            event_id: Event identifier

        Returns:
            EventDocument or None
        """
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            doc = await collection.find_one({"event_id": event_id})
            if doc:
                return EventDocument(**doc)
            return None

        except Exception as e:
            logger.error(f"Failed to retrieve event {event_id}: {e}")
            raise

    @classmethod
    async def list_events(
        cls,
        skip: int = 0,
        limit: int = 50,
        zone: str | None = None,
        threat_level: str | None = None,
        status: str | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> list[EventDocument]:
        """
        Lists events with pagination and filters.

        Args:
            skip: Number of items to skip
            limit: Maximum items to return
            zone: Filter by zone
            threat_level: Filter by threat level
            status: Filter by status
            start_time: Filter events after this time
            end_time: Filter events before this time

        Returns:
            List of EventDocument
        """
        try:
            db = get_database()
            collection = db[cls.COLLECTION_NAME]

            query = {}

            if zone:
                query["zone"] = zone
            if threat_level:
                query["threat_level"] = threat_level
            if status:
                query["status"] = status
            if start_time or end_time:
                query["timestamp"] = {}
                if start_time:
                    query["timestamp"]["$gte"] = start_time
                if end_time:
                    query["timestamp"]["$lte"] = end_time

            cursor = collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
            events = []
            async for doc in cursor:
                events.append(EventDocument(**doc))

            return events

        except Exception as e:
            logger.error(f"Failed to list events: {e}")
            raise

    @classmethod
    async def get_pending_ai_events(cls, limit: int = 100) -> list[EventDocument]:
        """
        Retrieves events that need AI analysis (CREATED status).

        Args:
            limit: Maximum events to return

        Returns:
            List of EventDocument
        """
        return await cls.list_events(skip=0, limit=limit, status=EventStatus.CREATED.value)


# Singleton instance
event_service = EventService()
