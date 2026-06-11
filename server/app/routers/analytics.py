"""
Analytics Router
API endpoints for operational intelligence.
"""

from fastapi import APIRouter, Depends
from loguru import logger

from app.auth.dependencies import require_permission
from app.auth.permissions import Permission
from app.schemas.user import UserInDB
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", summary="Get dashboard analytics")
async def get_analytics(
    current_user: UserInDB = Depends(require_permission(Permission.VIEW_ANALYTICS)),
):
    """Gets comprehensive analytics for the dashboard."""
    logger.debug(f"User {current_user.username} requested analytics")
    return await analytics_service.get_dashboard_analytics()
