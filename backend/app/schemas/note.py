from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class NoteBase(BaseModel):
    title: str
    content: str
    document_id: Optional[UUID] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    document_id: Optional[UUID] = None

class NoteResponse(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
