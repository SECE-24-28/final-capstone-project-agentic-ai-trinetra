"""
System Router
API endpoints for system status and metrics.
"""

import time
from datetime import datetime

import torch
from fastapi import APIRouter, Depends
from loguru import logger

from app.ai.service import ai_service
from app.auth.dependencies import require_permission
from app.auth.permissions import Permission
from app.config.settings import settings
from app.database import is_mongodb_connected, is_redis_connected
from app.notifications.websocket import websocket_manager
from app.schemas.user import UserInDB
from app.services.camera_service import camera_service

router = APIRouter(prefix="/system", tags=["system"])
start_time = time.time()


@router.get("/status", summary="Get comprehensive system status")
async def system_status(
    current_user: UserInDB = Depends(require_permission(Permission.VIEW_SYSTEM)),
):
    """Returns complete system health status."""
    try:
        # Check MongoDB
        mongodb_status = "connected" if is_mongodb_connected() else "disconnected"

        # Check Redis
        redis_status = "connected" if is_redis_connected() else "disconnected"

        # Check Groq AI
        try:
            ai_healthy = await ai_service.health_check()
            groq_status = "connected" if ai_healthy else "disconnected"
        except Exception as e:
            logger.error(f"Groq health check failed: {e}")
            groq_status = "error"

        # Check GPU
        gpu_available = torch.cuda.is_available()
        gpu_info = {
            "available": gpu_available,
            "device_count": torch.cuda.device_count() if gpu_available else 0,
            "device_name": torch.cuda.get_device_name(0) if gpu_available else None,
        }

        # Camera count
        all_cameras = await camera_service.list_cameras(limit=1000)
        camera_count = len(all_cameras)

        # Active WebSocket connections
        ws_connections = len(websocket_manager.active_connections)

        # Uptime
        uptime_seconds = time.time() - start_time
        hours, remainder = divmod(int(uptime_seconds), 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_formatted = f"{hours}h {minutes}m {seconds}s"

        overall_status = "healthy"
        if (
            mongodb_status != "connected"
            or redis_status != "connected"
            or groq_status != "connected"
        ):
            overall_status = "degraded"

        return {
            "status": overall_status,
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "mongodb": mongodb_status,
            "redis": redis_status,
            "groq": groq_status,
            "gpu": gpu_info,
            "cameras": {
                "total": camera_count,
                "active": 0,
            },
            "active_connections": ws_connections,
            "uptime": {
                "seconds": int(uptime_seconds),
                "formatted": uptime_formatted,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to retrieve system status: {e}")
        return {
            "status": "error",
            "message": "Failed to retrieve system status",
            "timestamp": datetime.utcnow().isoformat(),
        }


@router.get("/metrics", summary="Get detailed system metrics")
async def system_metrics(
    current_user: UserInDB = Depends(require_permission(Permission.VIEW_SYSTEM)),
):
    """Returns detailed resource usage metrics."""
    try:
        import psutil

        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_cores = psutil.cpu_count(logical=True)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage(str(settings.BASE_DIR))
        all_cameras = await camera_service.list_cameras(limit=1000)
        camera_count = len(all_cameras)
        ws_connections = len(websocket_manager.active_connections)
        uptime_seconds = time.time() - start_time

        return {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "cpu": {
                "usage_percent": cpu_percent,
                "cores": cpu_cores,
            },
            "memory": {
                "total_bytes": memory.total,
                "available_bytes": memory.available,
                "used_bytes": memory.used,
                "usage_percent": memory.percent,
            },
            "disk": {
                "total_bytes": disk.total,
                "used_bytes": disk.used,
                "free_bytes": disk.free,
                "usage_percent": disk.percent,
            },
            "cameras": {
                "total": camera_count,
            },
            "active_connections": ws_connections,
            "uptime_seconds": int(uptime_seconds),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except ImportError:
        logger.warning("psutil not available, returning limited metrics")
        all_cameras = await camera_service.list_cameras(limit=1000)
        return {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "cameras": {
                "total": len(all_cameras),
            },
            "active_connections": len(websocket_manager.active_connections),
            "uptime_seconds": int(time.time() - start_time),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to retrieve system metrics: {e}")
        return {
            "status": "error",
            "message": "Failed to retrieve system metrics",
            "timestamp": datetime.utcnow().isoformat(),
        }
