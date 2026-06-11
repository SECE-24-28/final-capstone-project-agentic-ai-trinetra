"""
AI Reasoning Module
Validates and normalizes Groq AI outputs.
"""

import json

from loguru import logger

from app.schemas.detection import AIReasoningResult, ThreatLevel


class ReasoningValidator:
    """Validates and normalizes AI responses."""

    @staticmethod
    def parse_and_validate(raw_response: str) -> AIReasoningResult | None:
        """
        Parses raw AI response and validates structure.

        Args:
            raw_response: Raw string response from Groq

        Returns:
            Validated AIReasoningResult or None if invalid
        """
        try:
            # Extract JSON if wrapped in extra text
            cleaned_response = ReasoningValidator._extract_json(raw_response)

            # Parse JSON
            data = json.loads(cleaned_response)

            # Validate required fields
            required_fields = [
                "summary",
                "threat_level",
                "recommended_action",
                "confidence",
                "soldier_message",
                "command_message",
            ]
            for field in required_fields:
                if field not in data:
                    logger.error(f"Missing required field: {field}")
                    return None

            # Validate threat_level
            threat_level = data["threat_level"].upper()
            if threat_level not in [level.value for level in ThreatLevel]:
                logger.error(f"Invalid threat_level: {threat_level}")
                return None

            # Validate confidence
            confidence = float(data["confidence"])
            if not (0.0 <= confidence <= 1.0):
                logger.error(f"Confidence out of range: {confidence}")
                return None

            # Create validated result
            result = AIReasoningResult(
                summary=data["summary"],
                threat_level=ThreatLevel(threat_level),
                recommended_action=data["recommended_action"],
                confidence=confidence,
                soldier_message=data["soldier_message"],
                command_message=data["command_message"],
            )

            logger.debug("AI response validated successfully")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error validating AI response: {e}")
            return None

    @staticmethod
    def _extract_json(text: str) -> str:
        """Extracts JSON from text that may have extra content."""
        text = text.strip()

        # Find first { and last }
        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end == -1 or start >= end:
            return text

        return text[start : end + 1]


# Singleton instance
reasoning_validator = ReasoningValidator()
