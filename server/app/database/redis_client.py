"""
Redis client connection management using redis-py (asyncio driver).
Provides a singleton Redis client for caching and message queuing.
"""

from loguru import logger
from redis.asyncio import Redis, from_url

from app.config.settings import settings


class RedisManager:
    """
    Manages Redis connection lifecycle and provides access to the Redis client.
    """

    def __init__(self) -> None:
        self.client: Redis | None = None

    async def connect(self) -> None:
        """
        Initializes the Redis client and connects to the server.
        """
        if self.client is not None:
            logger.warning("Redis client is already initialized.")
            return

        try:
            logger.info(f"Connecting to Redis at {settings.REDIS_URL}...")
            self.client = from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
            )
            # Verify connection by pinging the server
            await self.client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None
            raise

    async def disconnect(self) -> None:
        """
        Closes the Redis connection.
        """
        if self.client:
            logger.info("Closing Redis connection...")
            await self.client.close()
            self.client = None
            logger.info("Redis connection closed.")
        else:
            logger.warning("Redis client is not initialized, nothing to disconnect.")

    def get_client(self) -> Redis:
        """
        Returns the Redis client instance.
        Raises an error if the client is not initialized.
        """
        if self.client is None:
            raise RuntimeError("Redis client is not initialized. Call connect_redis() first.")
        return self.client

    def is_connected(self) -> bool:
        """
        Checks if Redis is currently connected.
        """
        return self.client is not None


# Singleton instance
_manager = RedisManager()


async def connect_redis() -> None:
    """Entry point for connecting to Redis."""
    await _manager.connect()


async def disconnect_redis() -> None:
    """Entry point for disconnecting from Redis."""
    await _manager.disconnect()


def get_redis() -> Redis:
    """Returns the singleton Redis client instance."""
    return _manager.get_client()


def is_redis_connected() -> bool:
    """Checks if Redis is connected."""
    return _manager.is_connected()
