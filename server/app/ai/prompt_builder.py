"""
Prompt Builder Module
Converts structured events into deterministic prompts for Groq AI.
"""

from loguru import logger


class PromptBuilder:
    """Builds standardized prompts for AI reasoning."""

    @staticmethod
    def build_event_analysis_prompt(
        camera: str, zone: str, movement: bool, objects: list[str]
    ) -> str:
        """
        Builds a prompt for analyzing a surveillance event.

        Args:
            camera: Camera identifier
            zone: Zone name
            movement: Whether movement was detected
            objects: List of detected object types

        Returns:
            Formatted prompt string
        """
        object_list = ", ".join(objects) if objects else "none"

        prompt = f"""
Analyze this surveillance event and provide a structured JSON response.

EVENT DETAILS:
- Camera: {camera}
- Zone: {zone}
- Movement Detected: {"Yes" if movement else "No"}
- Detected Objects: {object_list}

RESPONSE FORMAT (JSON ONLY, no extra text):
{{
  "summary": "Brief situation summary (1-2 sentences)",
  "threat_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "recommended_action": "Clear recommended action",
  "confidence": 0.0 to 1.0,
  "soldier_message": "Short message for soldiers (max 50 chars)",
  "command_message": "Short message for command center (max 100 chars)"
}}

RESPONSE RULES:
- Return only valid JSON, no other text
- threat_level must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL
- confidence must be a float between 0 and 1
- soldier_message must be concise and actionable
- command_message should include zone and camera details
"""

        logger.debug(f"Generated prompt for camera {camera}, zone {zone}")
        return prompt.strip()


# Singleton instance
prompt_builder = PromptBuilder()
