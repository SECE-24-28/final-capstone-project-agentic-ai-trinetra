# TRINETRA — AI Border Surveillance System

> त्रिनेत्र · The Third Eye of India

Real-time border surveillance system using computer vision and AI to detect unauthorized movement and instantly alert field troops.

---

## How It Works

1. Each border sector streams live video via RTSP (IP camera) or webcam
2. YOLOv8 detects persons, vehicles, and animals in every frame
3. Motion detection filters out static frames to reduce false positives
4. Threat level is assessed (HIGH / MEDIUM / LOW) based on detected objects
5. Alerts are pushed instantly to the dashboard via WebSocket and to soldiers' phones via ntfy.sh

---

## AI Core

Trinetra is built on two AI/ML components:

| Component | Technology | Role |
|---|---|---|
| Object Detection | **YOLOv8s** (Ultralytics, COCO-trained) | Detects persons, vehicles, animals in real-time at conf=0.6 |
| Motion Filtering | **MOG2** (Mixture of Gaussians v2, OpenCV) | ML-based background subtraction — learns scene over time, ignores static frames |
| Threat Classification | Rule-based inference on YOLO detections | Person+Vehicle=HIGH · Person=MEDIUM · Animal=LOW |
| Confidence Scoring | YOLOv8 per-detection scores | Filters false positives, capped at 99% in alerts |

---
