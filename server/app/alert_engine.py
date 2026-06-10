import json
import time
from app.redis_client import redis_client
from app.config import ALERT_COOLDOWN, SECTOR_LAST_ALERT
from app.whatsapp_service import send_notification


def send_alert(scene: str, objects: list, location: str, frame_path: str, sector_id: str = "default"):
    if not scene or "Unable to analyze" in scene:
        return None

    now = time.time()
    last = SECTOR_LAST_ALERT.get(sector_id, 0)
    if now - last < ALERT_COOLDOWN:
        print(f"Alert suppressed for {sector_id} (cooldown active)")
        return None

    SECTOR_LAST_ALERT[sector_id] = now

    alert = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "location": location,
        "objects": objects,
        "analysis": scene,
        "frame": frame_path
    }

    payload = json.dumps(alert)
    redis_client.publish("alerts", payload)
    redis_client.lpush("alert_history", payload)
    redis_client.ltrim("alert_history", 0, 99)

    send_notification(alert)

    print("ALERT SENT:", alert)
    return alert