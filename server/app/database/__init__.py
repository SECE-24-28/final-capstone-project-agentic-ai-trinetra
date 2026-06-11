"""
Database package for Trinetra.
Provides centralized access to MongoDB and Redis clients.
"""

from app.database.mongodb import (
    connect_mongodb,
    disconnect_mongodb,
    get_database,
    is_mongodb_connected,
)
from app.database.redis_client import (
    connect_redis,
    disconnect_redis,
    get_redis,
    is_redis_connected,
)

__all__ = [
    "connect_mongodb",
    "disconnect_mongodb",
    "get_database",
    "is_mongodb_connected",
    "connect_redis",
    "disconnect_redis",
    "get_redis",
    "is_redis_connected",
]
