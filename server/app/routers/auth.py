"""
Authentication Router
API endpoints for user authentication and management.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger

from app.auth.dependencies import get_current_active_user, get_user_from_db, require_permission
from app.auth.jwt import jwt_handler
from app.auth.password import password_handler
from app.auth.permissions import Permission
from app.database.mongodb import get_database
from app.schemas.user import Token, UserCreate, UserInDB, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    current_user: UserInDB = Depends(require_permission(Permission.MANAGE_USERS)),
):
    """Registers a new user (admin only)."""
    db = get_database()
    existing_user = await db["users"].find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered"
        )
    existing_email = await db["users"].find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    hashed_password = password_handler.hash_password(user_data.password)
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict.update(
        {
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    )

    result = await db["users"].insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    del user_dict["_id"]
    logger.info(f"Registered new user: {user_data.username} with role {user_data.role.value}")
    return UserResponse(**user_dict)


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Logs in a user and returns JWT token."""
    user = await get_user_from_db(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not password_handler.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    access_token = jwt_handler.create_access_token(data={"sub": user.username})
    logger.info(f"User {user.username} logged in")
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    """Returns current user's info."""
    return UserResponse(**current_user.model_dump())


@router.get("/users", response_model=list[UserResponse])
async def list_users(current_user: UserInDB = Depends(require_permission(Permission.MANAGE_USERS))):
    """Lists all users (admin only)."""
    db = get_database()
    cursor = db["users"].find({})
    users = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        users.append(UserResponse(**doc))
    return users
