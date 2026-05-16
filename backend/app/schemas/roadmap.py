from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class RoadmapGenerateRequest(BaseModel):
    learning_goal: str
    current_level: str = "Beginner"
    hours_per_week: int = 5
    deadline: str = "1 month"

class MilestoneResource(BaseModel):
    title: str
    url: str

class MilestoneBase(BaseModel):
    title: str
    description: str
    estimated_days: int
    order_index: int
    resources: List[MilestoneResource] = []

class MilestoneUpdate(BaseModel):
    status: str # not_started/in_progress/completed

class MilestoneResponse(MilestoneBase):
    id: UUID
    roadmap_id: UUID
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

class RoadmapBase(BaseModel):
    title: str
    description: str

class RoadmapResponse(RoadmapBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneResponse] = []
    
    model_config = {"from_attributes": True}
