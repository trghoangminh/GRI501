from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime

class QuizGenerateReq(BaseModel):
    topic: str
    num_questions: int = 10

class QuizQuestionResponse(BaseModel):
    id: UUID
    question: str
    options: List[str]
    order_index: int
    
    model_config = {"from_attributes": True}

class QuizQuestionFullResponse(QuizQuestionResponse):
    correct_answer: int
    explanation: str

class QuizResponse(BaseModel):
    id: UUID
    user_id: UUID
    document_id: Optional[UUID] = None
    title: str
    topic: str
    total_questions: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []
    
    model_config = {"from_attributes": True}

class QuizAttemptReq(BaseModel):
    answers: Dict[str, int] # question_id (stringified UUID) -> selected_index
    time_taken_seconds: int

class QuizAttemptResponse(BaseModel):
    score: float
    correct_answers: int
    explanations: Dict[str, str] # question_id -> explanation

class QuizStatsResponse(BaseModel):
    total_attempts: int
    avg_score: float
    best_score: float
    recent_attempts: List[dict]
