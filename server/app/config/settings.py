"""
Centralized configuration management for the Trinetra backend.
Uses pydantic-settings to load environment variables from .env files.
"""

from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings grouped by functionality.
    Values are loaded from environment variables or .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ==========================
    # Application
    # ==========================
    APP_NAME: str = Field(default="Trinetra")
    APP_VERSION: str = Field(default="0.1.0")
    ENVIRONMENT: Literal["development", "production", "testing"] = Field(default="development")
    DEBUG: bool = Field(default=True)
    LOG_LEVEL: str = Field(default="INFO")
    TIMEZONE: str = Field(default="Asia/Kolkata")

    # ==========================
    # Server
    # ==========================
    HOST: str = Field(default="127.0.0.1")
    PORT: int = Field(default=8000)

    # ==========================
    # AI (Groq)
    # ==========================
    AI_PROVIDER: str = Field(default="groq")
    GROQ_API_KEY: str | None = Field(default=None)
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile")
    GROQ_FALLBACK_MODEL: str = Field(default="llama-3.1-8b-instant")
    AI_REQUEST_TIMEOUT: int = Field(default=30)
    AI_MAX_RETRIES: int = Field(default=3)

    # ==========================
    # MongoDB
    # ==========================
    MONGO_URI: str = Field(default="mongodb://localhost:27017")
    MONGO_DB_NAME: str = Field(default="trinetra")

    # ==========================
    # Redis
    # ==========================
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # ==========================
    # JWT Security
    # ==========================
    SECRET_KEY: str = Field(default="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_FOR_PRODUCTION")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # ==========================
    # Storage
    # ==========================
    SNAPSHOT_DIR: str = Field(default="snapshots")
    CLIP_DIR: str = Field(default="clips")

    # ==========================
    # YOLO
    # ==========================
    FRAME_SKIP: int = Field(default=2)
    YOLO_MODEL: str = Field(default="yolov8n.pt")
    YOLO_CONFIDENCE: float = Field(default=0.50)
    YOLO_IOU: float = Field(default=0.45)

    # ==========================
    # Event Processing
    # ==========================
    EVENT_COOLDOWN_SECONDS: int = Field(default=7)

    # ==========================
    # MOG
    # ==========================
    MOG_HISTORY: int = Field(default=500)
    MOG_VAR_THRESHOLD: int = Field(default=16)
    MOG_DETECT_SHADOWS: bool = Field(default=True)

    # ==========================
    # Notification
    # ==========================
    WEBSOCKET_HOST: str = Field(default="0.0.0.0")
    WEBSOCKET_PORT: int = Field(default=8765)

    # ==========================
    # Storage
    # ==========================
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: str = Field(default="uploads")
    LOG_DIR: str = Field(default="logs")

    @property
    def LOG_FILE_PATH(self) -> Path:
        """Returns the absolute path to the log file."""
        log_path = self.BASE_DIR / self.LOG_DIR
        log_path.mkdir(parents=True, exist_ok=True)
        return log_path / "app.log"

    @property
    def UPLOAD_PATH(self) -> Path:
        """Returns the absolute path to the upload directory."""
        upload_path = self.BASE_DIR / self.UPLOAD_DIR
        upload_path.mkdir(parents=True, exist_ok=True)
        return upload_path

    @property
    def SNAPSHOT_PATH(self) -> Path:
        """Returns the absolute path to the snapshot directory."""
        snapshot_path = self.BASE_DIR / self.SNAPSHOT_DIR
        snapshot_path.mkdir(parents=True, exist_ok=True)
        return snapshot_path

    @property
    def CLIP_PATH(self) -> Path:
        """Returns the absolute path to the clip directory."""
        clip_path = self.BASE_DIR / self.CLIP_DIR
        clip_path.mkdir(parents=True, exist_ok=True)
        return clip_path


# Create a singleton instance of Settings
settings = Settings()
