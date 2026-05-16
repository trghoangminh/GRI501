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
                
    prompt = f"""Dựa trên dữ liệu học tập trong 7 ngày qua của học viên dưới đây, hãy đưa ra 3-4 nhận xét ngắn gọn, động viên và có tính gợi mở bằng TIẾNG VIỆT.
Hãy đặc biệt và tạo động lực cho học viên.

Dữ liệu:
- Tổng giờ đã học: {total_hours} giờ
- Các chủ đề đã học: {', '.join(all_topics) if all_topics else 'Chưa ghi nhận'}
- Số bài kiểm tra đã làm: {quiz_count}, Điểm trung bình: {avg_score:.1f}%
- Chuỗi học liên tiếp: {streak} ngày

Hãy viết 3-4 câu theo phong cách nói chuyện trực tiếp với học viên."""

    llm = get_llm(temperature=0.7)
    response = llm.invoke([("human", prompt)])
    
    content_raw = response.content
    if isinstance(content_raw, list):
        return "".join([c.get("text", "") for c in content_raw if isinstance(c, dict) and "text" in c]).strip()
    return str(content_raw).strip()
