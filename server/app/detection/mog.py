"""
MOG Detection Module
Implements motion detection using OpenCV's MOG2 Background Subtractor.
"""

import cv2
import numpy as np

from app.config.settings import settings


class MOGDetector:
    """
    Detects motion in video frames using Background Subtraction (MOG2).
    """

    def __init__(self):
        self.back_sub = cv2.createBackgroundSubtractorMOG2(
            history=settings.MOG_HISTORY,
            varThreshold=settings.MOG_VAR_THRESHOLD,
            detectShadows=settings.MOG_DETECT_SHADOWS,
        )
        self.min_contour_area = 500  # Configurable minimum area for motion

    def apply(self, frame: np.ndarray) -> tuple[np.ndarray, list[np.ndarray], bool]:
        """
        Processes a frame to detect motion.
        Returns the foreground mask, detected contours, and a boolean indicating movement.
        """
        # 1. Preprocessing: Gaussian Blur to reduce noise
        blurred = cv2.GaussianBlur(frame, (5, 5), 0)

        # 2. Apply Background Subtraction
        fg_mask = self.back_sub.apply(blurred)

        # 3. Postprocessing: Morphological operations to clean the mask
        # Opening to remove small noise points
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        # Closing to fill small holes in detected objects
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

        # 4. Contour Detection
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # 5. Filter contours by area
        valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > self.min_contour_area]
        movement_detected = len(valid_contours) > 0

        return fg_mask, valid_contours, movement_detected

    def reset(self):
        """
        Resets the background subtractor.
        """
        self.back_sub = cv2.createBackgroundSubtractorMOG2(
            history=settings.MOG_HISTORY,
            varThreshold=settings.MOG_VAR_THRESHOLD,
            detectShadows=settings.MOG_DETECT_SHADOWS,
        )
