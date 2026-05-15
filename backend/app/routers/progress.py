from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, timedelta, datetime
from app.database import get_db
from app.models.user import User
from app.models.progress import StudyLog
from app.models.document import Document
from app.models.quiz import QuizAttempt
from app.schemas.progress import StudyLogCreate, StudyLogResponse, StreakResponse, AnalyticsResponse, InsightsResponse
from app.core.dependencies import get_current_user
from app.services.progress_service import get_weekly_progress, generate_insights

router = APIRouter(prefix="/progress", tags=["progress"])

@router.post("/log", response_model=StudyLogResponse)
def log_progress(log_in: StudyLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = StudyLog(
        user_id=current_user.id,
        date=log_in.date,
        hours_studied=log_in.hours_studied,
        topics=log_in.topics,
        notes=log_in.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/weekly", response_model=List[StudyLogResponse])
def get_weekly(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_weekly_progress(db, current_user.id)

@router.get("/streak", response_model=StreakResponse)
def get_streak(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dates = db.query(StudyLog.date).filter(StudyLog.user_id == current_user.id).order_by(StudyLog.date.desc()).distinct().all()
    dates = [d[0] for d in dates]
    
    streak = 0
    longest_streak = 0
    current_date = date.today()
    last_study = dates[0] if dates else None
    
    if dates:
        # Calculate current streak
        if dates[0] == current_date or dates[0] == current_date - timedelta(days=1):
            expected = dates[0]
            for d in dates:
                if d == expected:
                    streak += 1
                    expected -= timedelta(days=1)
                else:
                    break
                    
        # Calculate longest streak
        current_long = 1
        longest_streak = 1
        for i in range(1, len(dates)):
            if dates[i-1] - dates[i] == timedelta(days=1):
                current_long += 1
                longest_streak = max(longest_streak, current_long)
            else:
                current_long = 1

    return {
        "current_streak": streak,
        "longest_streak": longest_streak,
        "last_study_date": last_study
    }

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 4 weeks of data
    four_weeks_ago = date.today() - timedelta(days=28)
    logs = db.query(StudyLog).filter(StudyLog.user_id == current_user.id, StudyLog.date >= four_weeks_ago).all()
    
    weekly_hours = {}
    topic_hours = {}
    total_hours = 0.0
    
    for log in logs:
        # Group by week start
        week_start = log.date - timedelta(days=log.date.weekday())
        week_str = week_start.isoformat()
        weekly_hours[week_str] = weekly_hours.get(week_str, 0) + log.hours_studied
        total_hours += log.hours_studied
        
        # Approximate topic distribution
        if log.topics:
            hours_per_topic = log.hours_studied / len(log.topics)
            for topic in log.topics:
                topic_hours[topic] = topic_hours.get(topic, 0) + hours_per_topic
                
    weekly_hours_list = [{"date": k, "hours": v} for k, v in sorted(weekly_hours.items())]
    topic_hours_list = [{"topic": k, "total_hours": v} for k, v in sorted(topic_hours.items(), key=lambda item: item[1], reverse=True)]
    
    # Quiz performance
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id, QuizAttempt.completed_at >= datetime.combine(four_weeks_ago, datetime.min.time())).all()
    quiz_perf = {}
    for a in attempts:
        d_str = a.completed_at.date().isoformat()
        if d_str not in quiz_perf:
            quiz_perf[d_str] = {"total": 0, "count": 0}
        quiz_perf[d_str]["total"] += a.score
        quiz_perf[d_str]["count"] += 1
        
    quiz_perf_list = [{"date": k, "avg_score": v["total"]/v["count"]} for k, v in sorted(quiz_perf.items())]
    
    total_docs = db.query(func.count(Document.id)).filter(Document.user_id == current_user.id).scalar()
    total_quizzes = db.query(func.count(QuizAttempt.id)).filter(QuizAttempt.user_id == current_user.id).scalar()
    
    # Total hours all time
    all_time_hours = db.query(func.sum(StudyLog.hours_studied)).filter(StudyLog.user_id == current_user.id).scalar() or 0.0
    
    return {
        "weekly_hours": weekly_hours_list,
        "topics_distribution": topic_hours_list,
        "quiz_performance": quiz_perf_list,
        "total_study_hours": float(all_time_hours),
        "total_documents": total_docs,
        "total_quizzes_taken": total_quizzes
    }

@router.get("/insights", response_model=InsightsResponse)
def get_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    insights = generate_insights(db, current_user.id)
    return {"insights": insights}
