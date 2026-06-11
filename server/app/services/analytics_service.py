"""
Analytics Service Module
Calculates and retrieves operational intelligence from the database.
"""

from datetime import datetime, timedelta
from typing import Any

from loguru import logger

from app.database.mongodb import get_database


class AnalyticsService:
    """Service for retrieving analytics data."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def get_dashboard_analytics(self) -> dict[str, Any]:
        """Gets comprehensive dashboard analytics."""
        db = get_database()

        # Total events & alerts count
        total_events = await db["events"].count_documents({})
        total_alerts = await db["events"].count_documents(
            {"threat_level": {"$in": ["medium", "high", "critical"]}}
        )

        # Threat distribution
        threat_pipeline = [{"$group": {"_id": "$threat_level", "count": {"$sum": 1}}}]
        threat_cursor = db["events"].aggregate(threat_pipeline)
        threat_distribution = {}
        async for doc in threat_cursor:
            threat_distribution[doc["_id"]] = doc["count"]

        # Zone activity
        zone_pipeline = [
            {"$group": {"_id": "$zone", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        zone_cursor = db["events"].aggregate(zone_pipeline)
        zone_activity = {}
        async for doc in zone_cursor:
            zone_activity[doc["_id"]] = doc["count"]

        # Camera activity
        camera_pipeline = [
            {"$group": {"_id": "$camera_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        camera_cursor = db["events"].aggregate(camera_pipeline)
        camera_activity = {}
        async for doc in camera_cursor:
            camera_activity[doc["_id"]] = doc["count"]

        # Hourly detections (last 24 hours)
        now = datetime.utcnow()
        yesterday = now - timedelta(hours=24)
        hourly_pipeline = [
            {"$match": {"timestamp": {"$gte": yesterday}}},
            {"$group": {"_id": {"$hour": "$timestamp"}, "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]
        hourly_cursor = db["events"].aggregate(hourly_pipeline)
        hourly_detections = {}
        async for doc in hourly_cursor:
            hourly_detections[doc["_id"]] = doc["count"]

        # Daily detections (last 7 days)
        week_ago = now - timedelta(days=7)
        daily_pipeline = [
            {"$match": {"timestamp": {"$gte": week_ago}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        daily_cursor = db["events"].aggregate(daily_pipeline)
        daily_detections = {}
        async for doc in daily_cursor:
            daily_detections[doc["_id"]] = doc["count"]

        # Weekly detections (last 4 weeks)
        month_ago = now - timedelta(weeks=4)
        weekly_pipeline = [
            {"$match": {"timestamp": {"$gte": month_ago}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%U", "date": "$timestamp"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        weekly_cursor = db["events"].aggregate(weekly_pipeline)
        weekly_detections = {}
        async for doc in weekly_cursor:
            weekly_detections[doc["_id"]] = doc["count"]

        analytics = {
            "total_events": total_events,
            "total_alerts": total_alerts,
            "threat_distribution": threat_distribution,
            "zone_activity": zone_activity,
            "camera_activity": camera_activity,
            "hourly_detections": hourly_detections,
            "daily_detections": daily_detections,
            "weekly_detections": weekly_detections,
            "average_ai_latency": 0.0,  # Future: track in DB
            "average_yolo_latency": 0.0,
        }

        logger.debug("Retrieved dashboard analytics")
        return analytics


# Singleton instance
analytics_service = AnalyticsService()
