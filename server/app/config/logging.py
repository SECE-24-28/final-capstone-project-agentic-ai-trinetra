"""
Logging configuration for the Trinetra backend using loguru.
Provides a unified logging interface with console and file output.
"""

import sys

from loguru import logger

from app.config.settings import settings


def setup_logging() -> None:
    """
    Configures loguru logger with console and rotating file sinks.
    Settings are pulled from the global settings object.
    """
    # Remove default handler
    logger.remove()

    # Log format: Timestamp | Level | Module:Function:Line | Message
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )

    # Console sink
    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=settings.DEBUG,
        diagnose=settings.DEBUG,
    )

    # File sink (rotating, retention, compression)
    logger.add(
        settings.LOG_FILE_PATH,
        format=log_format,
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        backtrace=True,
        diagnose=True,
    )

    logger.info("Logging system initialized.")


# Expose logger instance
__all__ = ["logger", "setup_logging"]
