import os

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Redis configuration
REDIS_HOST = "localhost"
REDIS_PORT = 6379

# Frame interval (seconds)
FRAME_INTERVAL = 2

# Alert cooldown per sector (seconds)
ALERT_COOLDOWN = 60

# Camera / post location label
CAMERA_LOCATION = os.getenv("CAMERA_LOCATION", "Border Post Alpha")

# Sector definitions
SECTORS = {
    "alpha": "Sector Alpha — North Border",
    "bravo": "Sector Bravo — East Perimeter",
    "charlie": "Sector Charlie — South Gate"
}

# ntfy.sh push notification topic (free, no account needed)
NTFY_TOPIC = os.getenv("NTFY_TOPIC", "trinetra-alerts")

# Evidence frames directory
FRAMES_DIR = os.path.join(os.path.dirname(__file__), "..", "evidence_frames")

# Per-sector alert cooldown tracker
SECTOR_LAST_ALERT = {"alpha": 0, "bravo": 0, "charlie": 0}