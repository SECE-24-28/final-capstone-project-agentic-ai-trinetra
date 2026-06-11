"""
Password Handling Module
Secure password hashing and verification using bcrypt.
"""

from loguru import logger
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordHandler:
    """Handles password hashing and verification."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes a plaintext password."""
        hashed = pwd_context.hash(password)
        logger.debug("Password hashed successfully")
        return hashed

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies a plaintext password against its hash."""
        valid = pwd_context.verify(plain_password, hashed_password)
        logger.debug(f"Password verification {'successful' if valid else 'failed'}")
        return valid


# Singleton instance
password_handler = PasswordHandler()
