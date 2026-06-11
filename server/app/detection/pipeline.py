"""
Detection Pipeline Module
Coordinates the movement detection flow using MOG2 + YOLO + Tracking.
"""

from typing import Any

import numpy as np
from loguru import logger

from app.detection.mog import MOGDetector
from app.detection.yolo import yolo_service


class ObjectTracker:
    """
    Simple object tracker using IoU (Intersection over Union) to track objects across frames.
    """

    def __init__(self):
        self.next_id = 1
        # tracking_id -> (bbox, class_name, confidence, frames_since_seen)
        self.tracked_objects = {}
        self.max_frames_missing = 30

    def _calculate_iou(self, bbox1: dict[str, int], bbox2: dict[str, int]) -> float:
        """Calculates IoU between two bounding boxes."""
        x1_1, y1_1, x2_1, y2_1 = bbox1["x1"], bbox1["y1"], bbox1["x2"], bbox1["y2"]
        x1_2, y1_2, x2_2, y2_2 = bbox2["x1"], bbox2["y1"], bbox2["x2"], bbox2["y2"]

        # Intersection
        x1_int = max(x1_1, x1_2)
        y1_int = max(y1_1, y1_2)
        x2_int = min(x2_1, x2_2)
        y2_int = min(y2_1, y2_2)

        if x1_int >= x2_int or y1_int >= y2_int:
            return 0.0

        intersection_area = (x2_int - x1_int) * (y2_int - y1_int)

        # Union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union_area = area1 + area2 - intersection_area

        return intersection_area / union_area if union_area > 0 else 0.0

    def update(self, detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Updates tracked objects with new detections and returns list of tracked objects."""
        matched_detections = set()
        updated_tracked = {}

        # Try to match existing tracked objects with new detections
        for track_id, (track_bbox, track_class, track_conf, _) in self.tracked_objects.items():
            best_iou = 0.0
            best_detection_idx = None

            for idx, det in enumerate(detections):
                if idx in matched_detections:
                    continue
                if det["class_name"] != track_class:
                    continue

                iou = self._calculate_iou(track_bbox, det["bbox"])
                if iou > best_iou and iou > 0.3:
                    best_iou = iou
                    best_detection_idx = idx

            if best_detection_idx is not None:
                det = detections[best_detection_idx]
                updated_tracked[track_id] = (det["bbox"], det["class_name"], det["confidence"], 0)
                matched_detections.add(best_detection_idx)
            else:
                # Object not seen this frame, increment missing count
                new_missing = self.tracked_objects[track_id][3] + 1
                if new_missing < self.max_frames_missing:
                    updated_tracked[track_id] = (track_bbox, track_class, track_conf, new_missing)

        # Add new detections as new tracked objects
        for idx, det in enumerate(detections):
            if idx not in matched_detections:
                updated_tracked[self.next_id] = (
                    det["bbox"],
                    det["class_name"],
                    det["confidence"],
                    0,
                )
                self.next_id += 1

        self.tracked_objects = updated_tracked

        # Return active tracked objects (not missing for too long)
        tracked_objects_list = []
        for track_id, (bbox, class_name, confidence, missing) in self.tracked_objects.items():
            if missing == 0:
                tracked_objects_list.append(
                    {
                        "type": class_name,
                        "confidence": confidence,
                        "tracking_id": track_id,
                        "bbox": bbox,
                    }
                )

        return tracked_objects_list


class DetectionPipeline:
    """
    Orchestrates the complete detection pipeline:
    MOG motion detection -> YOLO object detection -> Tracking.
    """

    def __init__(self):
        self.mog_detector = MOGDetector()
        self.tracker = ObjectTracker()
        self.frame_count = 0

    def process_frame(
        self, frame: np.ndarray, camera_id: str, zone: str
    ) -> tuple[bool, list[dict[str, Any]], list[dict[str, Any]], np.ndarray]:
        """
        Executes the complete detection pipeline on a single frame.
        Returns:
            - movement_detected (bool)
            - yolo_detections (list of YOLO detection dicts)
            - tracked_objects (list of tracked object dicts)
            - foreground_mask (np.ndarray)
        """
        try:
            self.frame_count += 1

            # Step 1: MOG Motion Detection
            fg_mask, contours, movement_detected = self.mog_detector.apply(frame)

            yolo_detections = []
            tracked_objects = []

            if movement_detected:
                logger.debug(f"[{camera_id}] Movement triggered YOLO detection")

                # Step 2: YOLO Detection
                yolo_detections = yolo_service.detect(frame)

                if yolo_detections:
                    # Step 3: Object Tracking
                    tracked_objects = self.tracker.update(yolo_detections)
                    logger.debug(f"[{camera_id}] Tracked objects: {len(tracked_objects)}")
            else:
                # Still update tracker to increment missing counts
                self.tracker.update([])

            return movement_detected, yolo_detections, tracked_objects, fg_mask

        except Exception as e:
            logger.error(f"Error in detection pipeline: {e}")
            return False, [], [], np.zeros(frame.shape[:2], dtype=np.uint8)

    def reset(self):
        """Resets the pipeline state (MOG detector and tracker)."""
        self.mog_detector.reset()
        self.tracker = ObjectTracker()
        self.frame_count = 0
