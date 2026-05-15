import json
from uuid import UUID
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.progress import StudyLog
from app.models.quiz import QuizAttempt, Quiz
from app.models.document import Document
from app.core.llm import get_llm

def get_weekly_progress(db: Session, user_id: UUID) -> list[StudyLog]:
    seven_days_ago = date.today() - timedelta(days=7)
    return db.query(StudyLog).filter(
        StudyLog.user_id == user_id, 
        StudyLog.date >= seven_days_ago
    ).order_by(StudyLog.date.asc()).all()

def generate_insights(db: Session, user_id: UUID) -> str:
    logs = get_weekly_progress(db, user_id)
    
    total_hours = sum(log.hours_studied for log in logs)
    all_topics = set()
    for log in logs:
        all_topics.update(log.topics)
        
    seven_days_ago = date.today() - timedelta(days=7)
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user_id,
        QuizAttempt.completed_at >= datetime.combine(seven_days_ago, datetime.min.time())
    ).all()
    
    quiz_count = len(attempts)
    avg_score = sum(a.score for a in attempts) / quiz_count if quiz_count > 0 else 0
    
    # Calculate streak (simple version)
    streak = 0
    current_date = date.today()
    
    # Get all distinct study dates ordered descending
    dates = db.query(StudyLog.date).filter(StudyLog.user_id == user_id).order_by(StudyLog.date.desc()).distinct().all()
    dates = [d[0] for d in dates]
    
    if dates and (dates[0] == current_date or dates[0] == current_date - timedelta(days=1)):
        expected_date = dates[0]
        for d in dates:
            if d == expected_date:
                streak += 1
                expected_date -= timedelta(days=1)
            else:
                break
                
    prompt = f"""Based on this student's study data from the past week, 
provide 3-4 short, encouraging, actionable insights.
Be specific and motivating.

Data:
- Total hours studied: {total_hours}
- Topics covered: {', '.join(all_topics) if all_topics else 'None recorded'}
- Quizzes taken: {quiz_count}, Average score: {avg_score:.1f}%
- Study streak: {streak} days

Write 3-4 sentences as if talking directly to the student."""

    llm = get_llm(temperature=0.7)
    response = llm.invoke([("human", prompt)])
    
    return response.content.strip()
