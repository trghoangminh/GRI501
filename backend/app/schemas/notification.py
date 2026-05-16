from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "system"

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
