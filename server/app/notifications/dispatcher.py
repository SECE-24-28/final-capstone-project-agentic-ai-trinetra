"""
Notification Dispatcher Module
Determines recipients and routes notifications.
"""

from collections import defaultdict

from loguru import logger

from app.ai.router import threat_router
from app.schemas.detection import NotificationPayload


class NotificationDispatcher:
    """Routes notifications to appropriate recipient groups."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.queues: dict[str, list[NotificationPayload]] = defaultdict(list)
        self.recipient_groups: dict[str, list[str]] = {
            "sector_officer": ["command_center"],
            "regional_command": ["command_center", "supervisors"],
            "patrolling_soldiers": ["mobile_units"],
            "emergency_broadcast": ["all"],
        }

    def dispatch(self, payload: NotificationPayload) -> list[str]:
        """
        Determines recipients and queues notification.

        Args:
            payload: Notification to dispatch

        Returns:
            List of recipient group names
        """
        # Get recipients based on threat level
        recipients = threat_router.get_recipients(payload.priority)

        # Get priority queue
        queue_name = threat_router.get_priority_queue(payload.priority)

        # Add to queue
        self.queues[queue_name].append(payload)

        logger.info(
            f"Notification dispatched - event_id: {payload.event_id}, "
            f"priority: {payload.priority.value}, "
            f"queue: {queue_name}, "
            f"recipients: {recipients}"
        )

        return recipients

    def get_queue(self, queue_name: str) -> list[NotificationPayload]:
        """
        Gets all notifications in a queue (and clears it).

        Args:
            queue_name: Queue identifier

        Returns:
            List of NotificationPayload
        """
        queue = self.queues.get(queue_name, [])
        self.queues[queue_name] = []
        return queue

    def get_all_queues(self) -> dict[str, list[NotificationPayload]]:
        """
        Gets all queues and clears them.

        Returns:
            Dict of queue name to notifications
        """
        queues = dict(self.queues)
        self.queues.clear()
        return queues

    def get_queue_count(self, queue_name: str) -> int:
        """
        Gets number of notifications in a queue.

        Args:
            queue_name: Queue identifier

        Returns:
            Count of notifications
        """
        return len(self.queues.get(queue_name, []))


# Singleton instance
notification_dispatcher = NotificationDispatcher()
