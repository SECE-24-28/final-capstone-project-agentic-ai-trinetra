"""
User Schemas
Pydantic models for user and authentication data structures.
"""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field


class UserRole(StrEnum):
    ADMIN = "admin"
    COMMAND_OFFICER = "command_officer"
    REGIONAL_OFFICER = "regional_officer"
    SOLDIER = "soldier"
    VIEWER = "viewer"


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: UserRole
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    username: str
    password: str


class UserInDB(UserBase):
    id: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None
