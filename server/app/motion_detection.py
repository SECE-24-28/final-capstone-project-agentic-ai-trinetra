import cv2

# Per-sector MOG2 background subtractor
# - history=500: learns background over 500 frames
# - varThreshold=50: higher = less sensitive to small changes (good for outdoor)
# - detectShadows=True: marks shadows separately so they don't count as motion
_subtractors: dict = {}

# Minimum contour area to count as real motion (filters out leaves, insects, noise)
MIN_MOTION_AREA = 1500


def detect_motion(frame, sector_id: str = "default") -> bool:
    if sector_id not in _subtractors:
        _subtractors[sector_id] = cv2.createBackgroundSubtractorMOG2(
            history=500, varThreshold=50, detectShadows=True
        )

    subtractor = _subtractors[sector_id]

    # Apply background subtraction — returns foreground mask
    # Shadow pixels are marked as 127, foreground as 255
    fg_mask = subtractor.apply(frame)

    # Remove shadows (127) — keep only definite foreground (255)
    _, fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)

    # Morphological cleanup — removes small noise blobs
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
    fg_mask = cv2.dilate(fg_mask, kernel, iterations=2)

    # Find contours of moving regions
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Only count motion if at least one contour is large enough
    return any(cv2.contourArea(c) > MIN_MOTION_AREA for c in contours)


def reset_sector(sector_id: str):
    _subtractors.pop(sector_id, None)
