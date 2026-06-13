"""
AI Service Module
Centralized Groq AI service for event reasoning.
"""

import asyncio
import time

from loguru import logger

from app.ai.prompt_builder import prompt_builder
from app.ai.reasoning import reasoning_validator
from app.config.settings import settings
from app.schemas.detection import AIReasoningResult, FusionEvent

# Try importing Groq, handle gracefully if not installed
AsyncGroq = None
try:
    from groq import AsyncGroq
except ImportError:
    logger.warning("Groq library not installed - AI features will be disabled")


class AIService:
    """Service for interacting with Groq AI."""

    _instance = None
    _client: AsyncGroq | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None and AsyncGroq is not None:
            self._initialize_client()

    def _initialize_client(self):
        """Initialize Groq client."""
        try:
            if not AsyncGroq:
                logger.warning("Groq library not available")
                return
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            logger.info("Groq client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
            # Don't raise, just disable AI

    async def analyze_event(self, event: FusionEvent) -> AIReasoningResult | None:
        """
        Analyzes a fusion event using Groq AI.

        Args:
            event: FusionEvent to analyze

        Returns:
            Validated AIReasoningResult or None
        """
        if not self._client:
            logger.error("Groq client not initialized")
            return None

        start_time = time.time()
        event_id = event.event_id
        camera_id = event.camera_id
        zone = event.zone

        logger.info(
            f"Groq inference started - event_id: {event_id}, camera: {camera_id}, zone: {zone}"
        )

        try:
            # Build prompt
            object_types = [obj.type for obj in event.objects]
            prompt = prompt_builder.build_event_analysis_prompt(
                camera=camera_id, zone=zone, movement=event.movement, objects=object_types
            )

            # Call Groq with retries
            max_retries = settings.AI_MAX_RETRIES
            attempt = 0

            while attempt < max_retries:
                try:
                    attempt += 1
                    logger.debug(f"AI attempt {attempt}/{max_retries}")

                    response = await self._client.chat.completions.create(
                        model=settings.GROQ_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        max_tokens=1024,
                        timeout=settings.AI_REQUEST_TIMEOUT,
                    )

                    raw_output = response.choices[0].message.content
                    if not raw_output:
                        logger.warning("Empty AI response")
                        if attempt < max_retries:
                            continue
                        return None

                    # Validate and parse
                    result = reasoning_validator.parse_and_validate(raw_output)

                    if result:
                        latency = time.time() - start_time
                        logger.info(
                            f"Groq inference completed - event_id: {event_id}, "
                            f"latency: {latency:.2f}s, "
                            f"threat_level: {result.threat_level.value}, "
                            f"confidence: {result.confidence:.2f}"
                        )
                        return result
                    else:
                        logger.warning(f"Invalid AI response on attempt {attempt}")
                        if attempt < max_retries:
                            continue
                        return None

                except Exception as e:
                    logger.error(f"Groq inference failed on attempt {attempt}: {e}")
                    if attempt < max_retries:
                        await asyncio.sleep(1 * attempt)  # Exponential backoff
                        continue
                    return None

        except Exception as e:
            logger.error(f"Groq inference aborted - event_id: {event_id}: {e}")
            return None

    async def health_check(self) -> bool:
        """
        Checks if AI service is healthy.

        Returns:
            True if healthy, False otherwise
        """
        if not self._client:
            return False

        try:
            # Simple API call to check connectivity
            await self._client.models.list()
            logger.debug("AI health check passed")
            return True
        except Exception as e:
            logger.error(f"AI health check failed: {e}")
            return False


# Add asyncio import

# Singleton instance
ai_service = AIService()
