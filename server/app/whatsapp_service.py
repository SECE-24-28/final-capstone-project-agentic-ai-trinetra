import requests
from app.config import NTFY_TOPIC


def send_notification(alert: dict):
    threat = "HIGH" if "HIGH" in alert["analysis"] else "MEDIUM" if "MEDIUM" in alert["analysis"] else "LOW"
    priority = "urgent" if threat == "HIGH" else "high" if threat == "MEDIUM" else "default"
    title = f"TRINETRA ALERT [{threat}] - {alert['location']}"
    body = (
        f"Detected: {', '.join(alert['objects'])}\n"
        f"{alert['analysis']}"
    )
    try:
        requests.post(
            f"https://ntfy.sh/{NTFY_TOPIC}",
            data=body.encode("utf-8"),
            headers={
                "Title": title,
                "Priority": priority,
                "Tags": "rotating_light,shield"
            }
        )
        print("ntfy notification sent")
    except Exception as e:
        print("ntfy error:", e)


def format_command_notification(message: str):
    try:
        requests.post(
            f"https://ntfy.sh/{NTFY_TOPIC}",
            data=message.encode("utf-8"),
            headers={
                "Title": "Officer Command",
                "Priority": "high",
                "Tags": "mega"
            }
        )
    except Exception as e:
        print("ntfy command error:", e)
