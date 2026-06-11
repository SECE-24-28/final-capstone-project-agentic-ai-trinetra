"""
Trinetra Backend E2E Validation Script
Automatically tests the complete surveillance pipeline.
"""

import asyncio
import sys
import time
from datetime import datetime
from pathlib import Path

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger

from app.ai.service import ai_service
from app.config.logging import setup_logging
from app.config.settings import settings
from app.database import connect_mongodb, connect_redis, disconnect_mongodb, disconnect_redis
from app.detection.pipeline import DetectionPipeline
from app.detection.yolo import yolo_service
from app.services.event_service import event_service


class E2ETestRunner:
    """Runs the complete end-to-end validation pipeline."""

    def __init__(self):
        self.passed_steps = []
        self.failed_steps = []
        self.test_event_id = None

    def log_step(self, name: str, passed: bool, error: str = None):
        """Logs a test step result."""
        if passed:
            self.passed_steps.append(name)
            logger.success(f"✓ {name}")
        else:
            self.failed_steps.append(name)
            logger.error(f"✗ {name}")
            if error:
                logger.error(f"  Error: {error}")

    async def run(self):
        """Runs all E2E tests."""
        print("\n" + "=" * 50)
        print("TRINETRA BACKEND - E2E VALIDATION REPORT")
        print("=" * 50 + "\n")

        setup_logging()

        # Step 1: Load Environment & Config
        try:
            _ = settings.APP_NAME
            self.log_step("Environment Loaded", True)
        except Exception as e:
            self.log_step("Environment Loaded", False, str(e))

        # Step 2: Check Directories
        try:
            assert settings.UPLOAD_PATH.exists()
            assert settings.SNAPSHOT_PATH.exists()
            assert settings.CLIP_PATH.exists()
            assert settings.LOG_FILE_PATH.parent.exists()
            self.log_step("Directories Valid", True)
        except Exception as e:
            self.log_step("Directories Valid", False, str(e))

        # Step 3: Connect MongoDB
        try:
            await connect_mongodb()
            self.log_step("MongoDB Connected", True)
        except Exception as e:
            self.log_step("MongoDB Connected", False, str(e))

        # Step 4: Connect Redis
        try:
            await connect_redis()
            self.log_step("Redis Connected", True)
        except Exception as e:
            self.log_step("Redis Connected", False, str(e))

        # Step 5: Load YOLO
        try:
            yolo_service.warmup()
            self.log_step("YOLO Model Loaded", True)
        except Exception as e:
            self.log_step("YOLO Model Loaded", False, str(e))

        # Step 6: Test Groq
        try:
            # Create a test event for Groq
            from app.schemas.detection import (
                EventStatus,
                FusionEvent,
                ThreatCategory,
                TrackedObject,
            )

            test_event = FusionEvent(
                event_id=f"test-event-{int(time.time())}",
                camera_id="test-cam-01",
                zone="Sector Test",
                timestamp=datetime.utcnow(),
                movement=True,
                objects=[TrackedObject(type="person", confidence=0.95, tracking_id=1)],
                confidence=0.95,
                threat_category=ThreatCategory.PERSON_DETECTED,
                status=EventStatus.CREATED,
            )
            ai_result = await ai_service.analyze_event(test_event)
            if ai_result:
                logger.info(f"  AI Summary: {ai_result.summary}")
                logger.info(f"  AI Threat Level: {ai_result.threat_level}")
                self.log_step("Groq Analysis Working", True)
            else:
                self.log_step("Groq Analysis Working", False, "No result returned")
        except Exception as e:
            self.log_step("Groq Analysis Working", False, str(e))

        # Step 7: Test Detection Pipeline (with dummy frame)
        try:
            import cv2
            import numpy as np

            pipeline = DetectionPipeline()
            test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.rectangle(test_frame, (150, 100), (300, 400), (255, 255, 255), -1)
            _ = pipeline.process_frame(
                frame=test_frame, camera_id="test-cam-01", zone="Sector Test"
            )
            self.log_step("Detection Pipeline Working", True)
        except Exception as e:
            self.log_step("Detection Pipeline Working", False, str(e))

        # Step 8: Test Event Creation
        try:
            from app.schemas.detection import (
                EventStatus,
                FusionEvent,
                ThreatCategory,
                TrackedObject,
            )

            test_event = FusionEvent(
                event_id=f"test-event-mongo-{int(time.time())}",
                camera_id="test-cam-01",
                zone="Sector Test",
                timestamp=datetime.utcnow(),
                movement=True,
                objects=[TrackedObject(type="person", confidence=0.95, tracking_id=1)],
                confidence=0.95,
                threat_category=ThreatCategory.PERSON_DETECTED,
                status=EventStatus.CREATED,
            )
            await event_service.save_event(test_event)
            self.test_event_id = test_event.event_id
            self.log_step("Event Saved to MongoDB", True)
        except Exception as e:
            self.log_step("Event Saved to MongoDB", False, str(e))

        # Step 9: Test Threat Classification
        try:
            from app.schemas.detection import (
                EventStatus,
                FusionEvent,
                ThreatCategory,
                TrackedObject,
            )
            from app.services.threat_service import threat_service

            test_event = FusionEvent(
                event_id=f"test-threat-{int(time.time())}",
                camera_id="test-cam-01",
                zone="Sector Test",
                timestamp=datetime.utcnow(),
                movement=True,
                objects=[TrackedObject(type="person", confidence=0.95, tracking_id=1)],
                confidence=0.95,
                threat_category=ThreatCategory.PERSON_DETECTED,
                status=EventStatus.CREATED,
            )
            decision = threat_service.assess_threat(test_event)
            logger.info(f"  Threat Decision: {decision.value}")
            self.log_step("Threat Classification Working", True)
        except Exception as e:
            self.log_step("Threat Classification Working", False, str(e))

        # Print final summary
        print("\n" + "=" * 50)
        print("VALIDATION SUMMARY")
        print("=" * 50)

        if self.failed_steps:
            print(f"\n❌ FAILED STEPS: {len(self.failed_steps)}")
            for step in self.failed_steps:
                print(f"  - {step}")
        else:
            print("\n✅ ALL STEPS PASSED!")

        print(f"\n✓ PASSED: {len(self.passed_steps)}")
        print(f"✗ FAILED: {len(self.failed_steps)}")

        overall_result = "PASS" if not self.failed_steps else "FAIL"
        print(f"\n{'=' * 50}")
        print(f"FINAL RESULT: {overall_result}")
        print(f"{'=' * 50}\n")

        # Cleanup
        await disconnect_mongodb()
        await disconnect_redis()

        return len(self.failed_steps) == 0


if __name__ == "__main__":
    runner = E2ETestRunner()
    success = asyncio.run(runner.run())
    sys.exit(0 if success else 1)
