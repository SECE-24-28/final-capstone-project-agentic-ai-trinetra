"""
Auth Dependencies Module
FastAPI dependencies for authentication and authorization.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from loguru import logger

from app.auth.jwt import jwt_handler
from app.auth.permissions import Permission, permission_checker
from app.database.mongodb import get_database
from app.schemas.user import UserInDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_user_from_db(username: str) -> UserInDB | None:
    """Retrieves a user from MongoDB by username."""
    db = get_database()
    doc = await db["users"].find_one({"username": username})
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        return UserInDB(**doc)
    return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    """Gets the current authenticated user from a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = jwt_handler.verify_token(token)
    if not token_data or not token_data.username:
        logger.warning("Invalid token data")
        raise credentials_exception

    user = await get_user_from_db(token_data.username)
    if not user:
        logger.warning(f"User {token_data.username} not found")
        raise credentials_exception

    logger.debug(f"Authenticated user {user.username}")
    return user


async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    """Gets the current active authenticated user."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user


def require_permission(permission: Permission):
    """Dependency factory for requiring a specific permission."""

    async def dependency(current_user: UserInDB = Depends(get_current_active_user)) -> UserInDB:
        if not permission_checker.has_permission(current_user.role, permission):
            logger.warning(
                f"User {current_user.username} (role {current_user.role.value}) "
                f"denied access to permission {permission.value}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
            )
        return current_user

    return dependency
