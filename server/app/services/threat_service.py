"""
Threat Service Module
Deterministic business rules for threat classification.
"""

from enum import StrEnum

from loguru import logger

from app.schemas.detection import (
    AIReasoningResult,
    FusionEvent,
    ThreatCategory,
    ThreatLevel,
    TrackedObject,
)


class DecisionLevel(StrEnum):
    """Decision levels from threat engine."""

    OBSERVATION = "observation"
    MONITORING_REQUIRED = "monitoring_required"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    POTENTIAL_THREAT = "potential_threat"
    CRITICAL_THREAT = "critical_threat"


class ThreatService:
    """Service for deterministic threat classification."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def assess_threat(
        self, event: FusionEvent, ai_result: AIReasoningResult | None = None
    ) -> DecisionLevel:
        """
        Merges all data sources to determine threat level.

        Args:
            event: FusionEvent with motion, YOLO, tracking
            ai_result: Optional AI analysis

        Returns:
            DecisionLevel classification
        """
        camera_id = event.camera_id
        zone = event.zone
        event_id = event.event_id
        threat_category = event.threat_category

        logger.info(
            f"Threat assessment started - event_id: {event_id}, "
            f"camera: {camera_id}, zone: {zone}, category: {threat_category.value}"
        )

        # Rule-based assessment first
        decision = self._apply_rules(event.objects, threat_category)

        # Override with AI if available and more severe
        if ai_result:
            ai_decision = self._ai_to_decision(ai_result.threat_level)
            if self._is_more_severe(ai_decision, decision):
                decision = ai_decision
                logger.info(f"AI overridden decision to: {decision.value}")

        logger.info(
            f"Threat assessment complete - event_id: {event_id}, decision: {decision.value}"
        )
        return decision

    def _apply_rules(
        self, objects: list[TrackedObject], threat_category: ThreatCategory
    ) -> DecisionLevel:
        """Applies deterministic rules."""
        object_types = [obj.type for obj in objects]
        person_count = object_types.count("person")
        vehicle_count = sum(
            1 for t in object_types if t in ["car", "truck", "motorcycle", "bus", "bicycle"]
        )

        # Rule 1: No objects - just observation
        if not objects:
            return DecisionLevel.OBSERVATION

        # Rule 2: Single person - monitoring
        if person_count == 1 and vehicle_count == 0:
            return DecisionLevel.MONITORING_REQUIRED

        # Rule 3: Multiple persons or person + vehicle - suspicious
        if (person_count >= 3) or (person_count >= 1 and vehicle_count >= 1):
            return DecisionLevel.SUSPICIOUS_ACTIVITY

        # Rule 4: Specific threat categories
        if threat_category in [ThreatCategory.MULTIPLE_PERSONS, ThreatCategory.PERSON_AND_VEHICLE]:
            return DecisionLevel.POTENTIAL_THREAT

        # Default based on category
        category_map = {
            ThreatCategory.NO_ACTIVITY: DecisionLevel.OBSERVATION,
            ThreatCategory.MOVEMENT_ONLY: DecisionLevel.OBSERVATION,
            ThreatCategory.PERSON_DETECTED: DecisionLevel.MONITORING_REQUIRED,
            ThreatCategory.MULTIPLE_PERSONS: DecisionLevel.POTENTIAL_THREAT,
            ThreatCategory.VEHICLE_DETECTED: DecisionLevel.MONITORING_REQUIRED,
            ThreatCategory.PERSON_AND_VEHICLE: DecisionLevel.POTENTIAL_THREAT,
            ThreatCategory.UNKNOWN_OBJECT: DecisionLevel.SUSPICIOUS_ACTIVITY,
        }

        return category_map.get(threat_category, DecisionLevel.OBSERVATION)

    def _ai_to_decision(self, ai_level: ThreatLevel) -> DecisionLevel:
        """Maps AI threat level to decision level."""
        mapping = {
            ThreatLevel.LOW: DecisionLevel.MONITORING_REQUIRED,
            ThreatLevel.MEDIUM: DecisionLevel.SUSPICIOUS_ACTIVITY,
            ThreatLevel.HIGH: DecisionLevel.POTENTIAL_THREAT,
            ThreatLevel.CRITICAL: DecisionLevel.CRITICAL_THREAT,
        }
        return mapping.get(ai_level, DecisionLevel.OBSERVATION)

    def _is_more_severe(self, level1: DecisionLevel, level2: DecisionLevel) -> bool:
        """Checks if level1 is more severe than level2."""
        severity_order = [
            DecisionLevel.OBSERVATION,
            DecisionLevel.MONITORING_REQUIRED,
            DecisionLevel.SUSPICIOUS_ACTIVITY,
            DecisionLevel.POTENTIAL_THREAT,
            DecisionLevel.CRITICAL_THREAT,
        ]
        return severity_order.index(level1) > severity_order.index(level2)


# Singleton instance
threat_service = ThreatService()
