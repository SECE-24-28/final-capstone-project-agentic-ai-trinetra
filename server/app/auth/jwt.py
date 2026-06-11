"""
JWT Handling Module
JWT token generation, verification, and refresh handling.
"""

from datetime import datetime, timedelta

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from loguru import logger

from app.config.settings import settings
from app.schemas.user import TokenData


class JWTHandler:
    """Handles JWT token operations."""

    def __init__(self, secret_key: str, algorithm: str, access_token_expire_minutes: int):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None) -> str:
        """Creates a JWT access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + (
            expires_delta or timedelta(minutes=self.access_token_expire_minutes)
        )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        logger.debug("Created JWT access token")
        return encoded_jwt

    def verify_token(self, token: str) -> TokenData | None:
        """Verifies a JWT token and returns TokenData."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")
            if username is None:
                logger.warning("JWT token missing 'sub' claim")
                return None
            token_data = TokenData(username=username)
            logger.debug(f"Successfully verified JWT token for user {username}")
            return token_data
        except ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except JWTError as e:
            logger.error(f"JWT token verification failed: {e}")
            return None


# Singleton instance
jwt_handler = JWTHandler(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
)
