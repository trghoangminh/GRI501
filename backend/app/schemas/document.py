from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    original_name: str
    file_type: str
    file_size: int
    status: str
    summary: Optional[str] = None
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}

class DocumentSummaryResponse(BaseModel):
    summary: str
