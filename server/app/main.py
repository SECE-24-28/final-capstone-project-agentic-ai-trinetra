"""
Trinetra Backend - FastAPI Application
Main entry point for the backend service.
"""

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.cameras.manager import camera_manager
from app.config.logging import logger, setup_logging
from app.config.settings import settings
from app.database import (
    connect_mongodb,
    connect_redis,
    disconnect_mongodb,
    disconnect_redis,
)

# Import WebSocket manager
from app.notifications.websocket import websocket_manager
from app.routers.alerts import router as alerts_router
from app.routers.analytics import router as analytics_router
from app.routers.auth import router as auth_router

# Import all routers
from app.routers.cameras import router as cameras_router
from app.routers.health import router as health_router
from app.routers.system import router as system_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    setup_logging()

    logger.info("=" * 40)
    logger.info(f"{settings.APP_NAME} Backend Starting")
    logger.info(f"Environment : {settings.ENVIRONMENT}")
    logger.info(f"AI Provider : {settings.AI_PROVIDER.capitalize()}")

    logger.info("\n=== Starting Validation ===")
    validation_passed = True

    # Check directories
    try:
        _ = settings.UPLOAD_PATH
        _ = settings.SNAPSHOT_PATH
        _ = settings.CLIP_PATH
        _ = settings.LOG_FILE_PATH
        logger.info("Directories : Created/Exist")
    except Exception as e:
        logger.error(f"Directories : Failed ({e})")
        validation_passed = False

    # Check YOLO
    try:
        from app.detection.yolo import yolo_service

        yolo_service.warmup()
        logger.info("YOLO Model : Loaded")
    except Exception as e:
        logger.error(f"YOLO Model : Failed ({e})")
        validation_passed = False

    # Check MongoDB
    try:
        await connect_mongodb()
        logger.info("MongoDB     : Connected")
    except Exception as e:
        logger.error(f"MongoDB     : Failed ({e})")
        validation_passed = False

    # Check Redis
    try:
        await connect_redis()
        logger.info("Redis       : Connected")
    except Exception as e:
        logger.error(f"Redis       : Failed ({e})")
        validation_passed = False

    # Check Groq
    try:
        from app.ai.service import ai_service

        ai_healthy = await ai_service.health_check()
        if ai_healthy:
            logger.info("Groq AI     : Reachable")
        else:
            logger.warning("Groq AI     : Unreachable (may still work)")
    except Exception as e:
        logger.warning(f"Groq AI     : Check Failed ({e})")

    logger.info("=== Validation Complete ===")
    if not validation_passed:
        logger.critical("One or more critical dependencies failed!")
        # Don't fail startup completely, but log warning
        # raise RuntimeError("Critical dependencies missing")

    # Start WebSocket heartbeat
    await websocket_manager.start_heartbeat()
    logger.info("WebSocket Heartbeat : Started")

    # Register laptop webcam automatically
    try:
        await camera_manager.register_camera({
            "camera_id": "laptop-webcam",
            "name": "Laptop Webcam",
            "zone": "Office",
            "location": "Desk",
            "stream_url": 0,  # 0 is default webcam in OpenCV
            "enabled": True,
        })
        logger.info("Laptop webcam registered successfully")
    except Exception as e:
        logger.error(f"Failed to register laptop webcam: {e}")

    logger.info("=" * 40)

    yield

    # Shutdown
    logger.info("=" * 40)
    logger.info(f"Shutting down {settings.APP_NAME}...")

    # Stop WebSocket heartbeat
    await websocket_manager.stop_heartbeat()
    logger.info("WebSocket Heartbeat : Stopped")

    await camera_manager.shutdown()
    await disconnect_mongodb()
    await disconnect_redis()

    logger.info(f"{settings.APP_NAME} clean termination complete.")
    logger.info("=" * 40)


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered surveillance system backend.",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(system_router)
app.include_router(analytics_router)
app.include_router(cameras_router)
app.include_router(alerts_router)


@app.get("/", tags=["General"])
async def root() -> dict[str, str]:
    """
    Root endpoint returning basic API information.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications."""
    await websocket.accept()
    await websocket_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
