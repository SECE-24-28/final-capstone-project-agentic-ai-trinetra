"""
Password Handling Module
Secure password hashing and verification using bcrypt.
"""

import bcrypt
from loguru import logger


class PasswordHandler:
    """Handles password hashing and verification."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes a plaintext password."""
        # Hash the password with bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        logger.debug("Password hashed successfully")
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies a plaintext password against its hash."""
        valid = bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
        logger.debug(f"Password verification {'successful' if valid else 'failed'}")
        return valid


# Singleton instance
password_handler = PasswordHandler()
