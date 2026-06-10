from ultralytics import YOLO
import torch
import os

# Monkey patch torch.load to use weights_only=False for YOLO compatibility
original_torch_load = torch.load

def patched_torch_load(f, *args, **kwargs):
    # Force weights_only=False for YOLO model loading
    kwargs['weights_only'] = False
    return original_torch_load(f, *args, **kwargs)

torch.load = patched_torch_load

# Get the correct path to the model file
model_path = os.path.join(os.path.dirname(__file__), "..", "yolov8s.pt")
model = YOLO(model_path)

VEHICLES = ["car", "truck", "bus", "motorbike"]
ANIMALS = ["dog", "cow", "horse", "sheep", "cat"]


def detect_objects(frame):
    results = model(frame, conf=0.6)

    detected = []
    counts = {}

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            cls = int(box.cls)
            label = model.names[cls]

            if label == "person":
                category = "person"
            elif label in VEHICLES:
                category = "vehicle"
            elif label in ANIMALS:
                category = "animal"
            else:
                continue

            counts[category] = counts.get(category, 0) + 1
            if category not in detected:
                detected.append(category)

    return detected, counts