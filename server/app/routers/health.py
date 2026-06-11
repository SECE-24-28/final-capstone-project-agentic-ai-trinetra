"""
Health Check Router
API endpoints for health checks.
"""

from typing import Any

from fastapi import APIRouter
from loguru import logger

from app.config.settings import settings
from app.database import is_mongodb_connected, is_redis_connected

router = APIRouter(tags=["health"])


@router.get("/health", summary="Basic health check")
async def health_check() -> dict[str, Any]:
    """Basic health check endpoint."""
    try:
        mongodb_status = "connected" if is_mongodb_connected() else "disconnected"
        redis_status = "connected" if is_redis_connected() else "disconnected"

        overall_status = "ok"
        if mongodb_status != "connected" or redis_status != "connected":
            overall_status = "degraded"

        return {
            "status": overall_status,
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "mongodb": mongodb_status,
            "redis": redis_status,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }
