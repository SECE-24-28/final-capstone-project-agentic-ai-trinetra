"""
Alerts Router
API endpoints for alerts and events.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.auth.dependencies import require_permission
from app.auth.permissions import Permission
from app.schemas.alert import Event
from app.schemas.user import UserInDB
from app.services.event_service import event_service

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=list[Event], summary="List alerts")
@router.get("/events", response_model=list[Event], summary="List events")
async def list_events(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of items to return"),
    zone: str | None = Query(None, description="Filter by zone"),
    threat_level: str | None = Query(None, description="Filter by threat level"),
    status: str | None = Query(None, description="Filter by status"),
    start_time: datetime | None = Query(None, description="Filter events after this time"),
    end_time: datetime | None = Query(None, description="Filter events before this time"),
    current_user: UserInDB = Depends(require_permission(Permission.READ_EVENTS)),
):
    """Lists events (and alerts) with pagination and filters."""
    try:
        events = await event_service.list_events(
            skip, limit, zone, threat_level, status, start_time, end_time
        )

        # Convert EventDocument to Event model
        response_events = []
        for doc in events:
            event_dict = doc.model_dump()
            event_dict["id"] = doc.event_id  # Add id field
            response_events.append(Event(**event_dict))

        logger.info(f"User {current_user.username} listed {len(response_events)} events")
        return response_events

    except Exception as e:
        logger.error(f"Failed to list events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list events"
        ) from e


@router.get("/alerts/{event_id}", response_model=Event, summary="Get an alert by ID")
@router.get("/events/{event_id}", response_model=Event, summary="Get an event by ID")
async def get_event(
    event_id: str, current_user: UserInDB = Depends(require_permission(Permission.READ_EVENTS))
):
    """Retrieves a specific event (or alert) by its ID."""
    try:
        doc = await event_service.get_event_by_id(event_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Event {event_id} not found"
            )

        # Convert to Event model
        event_dict = doc.model_dump()
        event_dict["id"] = doc.event_id
        logger.info(f"User {current_user.username} retrieved event {event_id}")
        return Event(**event_dict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve event"
        ) from e
