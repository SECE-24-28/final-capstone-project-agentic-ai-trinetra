"""
YOLO Detection Module
Implements object detection and tracking using YOLO from Ultralytics.
"""

import time
from typing import Any

import numpy as np
import torch
from loguru import logger
from ultralytics import YOLO

from app.config.settings import settings


class YOLOService:
    """
    Singleton YOLO detection service that loads the model once and provides detection capabilities.
    """

    _instance = None
    _model = None
    _device = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            self._initialize_model()

    def _initialize_model(self) -> None:
        """
        Initializes the YOLO model, selects device (CUDA/CPU), and logs initialization details.
        """
        start_time = time.time()

        # Check for CUDA availability
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"YOLO initializing on device: {self._device}")

        try:
            # Load YOLO model
            self._model = YOLO(settings.YOLO_MODEL)
            self._model.to(self._device)

            load_time = time.time() - start_time
            logger.info(f"YOLO model loaded successfully in {load_time:.2f} seconds")

        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise

    def warmup(self) -> None:
        """
        Runs a warmup inference to initialize the model and reduce first inference latency.
        """
        if self._model is None:
            logger.warning("YOLO model not initialized, skipping warmup")
            return

        logger.info("Running YOLO warmup...")
        dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        start_time = time.time()
        self._model(dummy_frame, verbose=False)
        warmup_time = time.time() - start_time
        logger.info(f"YOLO warmup completed in {warmup_time:.2f} seconds")

    def detect(self, frame: np.ndarray) -> list[dict[str, Any]]:
        """
        Runs YOLO detection on a single frame.
        Returns list of detected objects with class, confidence, and bounding box.
        """
        if self._model is None:
            logger.error("YOLO model not initialized")
            return []

        try:
            # Run inference
            results = self._model(
                frame, conf=settings.YOLO_CONFIDENCE, iou=settings.YOLO_IOU, verbose=False
            )

            detections = []
            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()

                    detections.append(
                        {
                            "class_id": class_id,
                            "class_name": class_name,
                            "confidence": confidence,
                            "bbox": {"x1": int(x1), "y1": int(y1), "x2": int(x2), "y2": int(y2)},
                        }
                    )

            if detections:
                class_names = [d["class_name"] for d in detections]
                logger.debug(f"YOLO detected {len(detections)} objects: {class_names}")

            return detections

        except Exception as e:
            logger.error(f"Error during YOLO detection: {e}")
            return []


# Create singleton instance
yolo_service = YOLOService()
