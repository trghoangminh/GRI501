from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime

class StudyLogCreate(BaseModel):
    date: date
    hours_studied: float
    topics: List[str] = []
    notes: Optional[str] = None

class StudyLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    date: date
    hours_studied: float
    topics: List[str]
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_study_date: Optional[date] = None

class AnalyticsResponse(BaseModel):
    weekly_hours: List[dict] # [{'date': '...', 'hours': float}]
    topics_distribution: List[dict] # [{'topic': '...', 'total_hours': float}]
    quiz_performance: List[dict] # [{'date': '...', 'avg_score': float}]
    total_study_hours: float
    total_documents: int
    total_quizzes_taken: int

class InsightsResponse(BaseModel):
    insights: str
