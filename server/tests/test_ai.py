"""
AI Module Unit Tests
Tests prompt building and reasoning validation.
"""

from app.ai.prompt_builder import prompt_builder
from app.ai.reasoning import reasoning_validator
from app.schemas.detection import ThreatLevel


class TestPromptBuilder:
    """Tests for the prompt builder module."""

    def test_build_event_analysis_prompt(self):
        """Test that a prompt is correctly built."""
        prompt = prompt_builder.build_event_analysis_prompt(
            camera="cam-01", zone="Sector Test", movement=True, objects=["person", "car"]
        )
        assert "cam-01" in prompt
        assert "Sector Test" in prompt
        assert "person" in prompt
        assert "car" in prompt


class TestReasoningValidator:
    """Tests for the reasoning validator module."""

    def test_parse_valid_response(self):
        """Test validating a correct AI response."""
        valid_json = """
        {
            "summary": "Person and car detected near Sector Test",
            "threat_level": "MEDIUM",
            "recommended_action": "Monitor the situation",
            "confidence": 0.85,
            "soldier_message": "Check Sector Test",
            "command_message": "Person and car at Sector Test"
        }
        """
        result = reasoning_validator.parse_and_validate(valid_json)
        assert result is not None
        assert result.threat_level == ThreatLevel.MEDIUM
        assert result.confidence == 0.85

    def test_parse_invalid_response_missing_field(self):
        """Test validation fails on missing required field."""
        invalid_json = """
        {
            "summary": "Person detected",
            "recommended_action": "Monitor",
            "confidence": 0.9,
            "soldier_message": "Check",
            "command_message": "Person"
        }
        """
        result = reasoning_validator.parse_and_validate(invalid_json)
        assert result is None

    def test_parse_invalid_threat_level(self):
        """Test validation fails on invalid threat level."""
        invalid_json = """
        {
            "summary": "Person detected",
            "threat_level": "NOT_A_LEVEL",
            "recommended_action": "Monitor",
            "confidence": 0.9,
            "soldier_message": "Check",
            "command_message": "Person"
        }
        """
        result = reasoning_validator.parse_and_validate(invalid_json)
        assert result is None
