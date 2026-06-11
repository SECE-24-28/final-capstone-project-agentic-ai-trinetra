"""
AI Router Module
Maps threat levels to appropriate handling paths.
"""

from loguru import logger

from app.schemas.detection import ThreatLevel


class ThreatRouter:
    """Routes threats based on severity level."""

    # Recipient groups
    RECIPIENTS = {
        ThreatLevel.LOW: ["sector_officer"],
        ThreatLevel.MEDIUM: ["sector_officer", "regional_command"],
        ThreatLevel.HIGH: ["sector_officer", "regional_command", "patrolling_soldiers"],
        ThreatLevel.CRITICAL: ["emergency_broadcast", "all"],
    }

    # Priority levels
    PRIORITY_QUEUE = {
        ThreatLevel.LOW: "low",
        ThreatLevel.MEDIUM: "medium",
        ThreatLevel.HIGH: "high",
        ThreatLevel.CRITICAL: "critical",
    }

    @staticmethod
    def get_recipients(threat_level: ThreatLevel) -> list[str]:
        """
        Gets list of recipients for a threat level.

        Args:
            threat_level: Threat severity level

        Returns:
            List of recipient group names
        """
        recipients = ThreatRouter.RECIPIENTS.get(threat_level, [])
        logger.debug(f"Routed {threat_level.value} threat to: {recipients}")
        return recipients

    @staticmethod
    def get_priority_queue(threat_level: ThreatLevel) -> str:
        """
        Gets priority queue name for a threat level.

        Args:
            threat_level: Threat severity level

        Returns:
            Queue name string
        """
        queue = ThreatRouter.PRIORITY_QUEUE.get(threat_level, "low")
        return queue


# Singleton instance
threat_router = ThreatRouter()
