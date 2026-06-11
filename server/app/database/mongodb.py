"""
MongoDB database connection management using Motor (asyncio driver).
Provides a singleton client and database interface.
"""

from loguru import logger
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config.settings import settings


class MongoDBManager:
    """
    Manages MongoDB connection lifecycle and provides access to the database instance.
    """

    def __init__(self) -> None:
        self.client: AsyncIOMotorClient | None = None
        self.db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        """
        Initializes the MongoDB client and connects to the server.
        """
        if self.client is not None:
            logger.warning("MongoDB client is already initialized.")
            return

        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
            self.client = AsyncIOMotorClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=5000,
            )
            # Verify connection by pinging the server
            await self.client.admin.command("ping")
            self.db = self.client[settings.MONGO_DB_NAME]
            logger.info(f"Successfully connected to MongoDB database: {settings.MONGO_DB_NAME}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.client = None
            self.db = None
            raise

    async def disconnect(self) -> None:
        """
        Closes the MongoDB connection.
        """
        if self.client:
            logger.info("Closing MongoDB connection...")
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed.")
        else:
            logger.warning("MongoDB client is not initialized, nothing to disconnect.")

    def get_database(self) -> AsyncIOMotorDatabase:
        """
        Returns the database instance.
        Raises an error if the database is not initialized.
        """
        if self.db is None:
            raise RuntimeError("MongoDB database is not initialized. Call connect_mongodb() first.")
        return self.db

    def is_connected(self) -> bool:
        """
        Checks if the database is currently connected.
        """
        return self.db is not None


# Singleton instance
_manager = MongoDBManager()


async def connect_mongodb() -> None:
    """Entry point for connecting to MongoDB."""
    await _manager.connect()


async def disconnect_mongodb() -> None:
    """Entry point for disconnecting from MongoDB."""
    await _manager.disconnect()


def get_database() -> AsyncIOMotorDatabase:
    """Returns the singleton database instance."""
    return _manager.get_database()


def is_mongodb_connected() -> bool:
    """Checks if MongoDB is connected."""
    return _manager.is_connected()
