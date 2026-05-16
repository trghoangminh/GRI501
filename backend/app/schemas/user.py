from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import date, datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    learning_goal: Optional[str] = None
    current_level: Optional[str] = None
    hours_per_week: Optional[int] = None
    deadline: Optional[date] = None

class UserProfile(UserBase):
    id: UUID
    avatar_url: Optional[str] = None
    learning_goal: Optional[str] = None
    current_level: Optional[str] = None
    hours_per_week: Optional[int] = None
    deadline: Optional[date] = None
    is_active: bool
    role: str
    created_at: datetime
    updated_at: datetime
    
    # Gamification
    current_streak: Optional[int] = 0
    longest_streak: Optional[int] = 0
    exp_points: Optional[int] = 0

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfile

class RefreshTokenReq(BaseModel):
    refresh_token: str

class ForgotPasswordReq(BaseModel):
    email: EmailStr

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str = Field(min_length=6)
