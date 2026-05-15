from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    has_rag_context: bool
    created_at: datetime

    model_config = {"from_attributes": True}
