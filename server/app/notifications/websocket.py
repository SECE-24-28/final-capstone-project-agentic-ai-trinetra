"""
WebSocket Notifications Module
Handles WebSocket connections and broadcasting.
"""

import asyncio
import json
from datetime import datetime
from typing import Any

from loguru import logger

from app.schemas.detection import NotificationPayload


class WebSocketManager:
    """Manages active WebSocket connections."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.active_connections: set[Any] = set()
        self.heartbeat_task: asyncio.Task | None = None
        self.is_running = False

    async def start_heartbeat(self):
        """Starts periodic heartbeat to keep connections alive."""
        if self.is_running:
            return

        self.is_running = True
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        logger.info("WebSocket heartbeat started")

    async def stop_heartbeat(self):
        """Stops heartbeat loop."""
        self.is_running = False
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
            try:
                await self.heartbeat_task
            except asyncio.CancelledError:
                pass
        logger.info("WebSocket heartbeat stopped")

    async def _heartbeat_loop(self):
        """Sends periodic heartbeats to all connected clients."""
        while self.is_running:
            try:
                await asyncio.sleep(30)  # Every 30 seconds
                if self.active_connections:
                    heartbeat_msg = json.dumps(
                        {"type": "heartbeat", "timestamp": datetime.now().isoformat()}
                    )
                    await self._broadcast_raw(heartbeat_msg)
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")

    async def connect(self, websocket: Any):
        """
        Registers a new WebSocket connection.

        Args:
            websocket: WebSocket connection object
        """
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected - total: {len(self.active_connections)}")

    async def disconnect(self, websocket: Any):
        """
        Unregisters a WebSocket connection.

        Args:
            websocket: WebSocket connection object
        """
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected - total: {len(self.active_connections)}")

    async def broadcast(self, payload: NotificationPayload):
        """
        Broadcasts a notification to all connected clients.

        Args:
            payload: NotificationPayload to send
        """
        message = json.dumps(
            {
                "type": "notification",
                "data": payload.model_dump(),
                "timestamp": datetime.now().isoformat(),
            }
        )
        await self._broadcast_raw(message)
        logger.info(
            f"Notification broadcast - event_id: {payload.event_id}, "
            f"priority: {payload.priority.value}, "
            f"recipients: {len(self.active_connections)}"
        )

    async def _broadcast_raw(self, message: str):
        """
        Sends raw message string to all connections (with cleanup).

        Args:
            message: Message string to send
        """
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send message: {e}")
                disconnected.add(connection)

        # Cleanup disconnected connections
        for conn in disconnected:
            await self.disconnect(conn)


# Singleton instance
websocket_manager = WebSocketManager()
