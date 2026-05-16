from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, QuizAttempt
from app.schemas.quiz import QuizGenerateReq, QuizResponse, QuizAttemptReq, QuizAttemptResponse, QuizStatsResponse
from app.core.dependencies import get_current_user
from app.services.quiz_service import generate_quiz
from app.services.settings_service import get_setting_value
from app.services.gamification_service import log_user_activity

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.post("/generate", response_model=QuizResponse)
def generate(req: QuizGenerateReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not get_setting_value(db, "quiz_generation"):
        raise HTTPException(status_code=403, detail="Tính năng tự động tạo câu hỏi hiện đang bị vô hiệu hóa.")
    quiz = generate_quiz(db, current_user.id, req.topic, req.num_questions)
    return quiz

@router.get("/", response_model=List[QuizResponse])
def get_quizzes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()
    return quizzes

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # Standard QuizResponse will include questions (from Pydantic schema)
    # The QuizQuestionFullResponse has correct_answer, but we map to QuizQuestionResponse which omits it.
    return quiz

@router.post("/{quiz_id}/attempt", response_model=QuizAttemptResponse)
def submit_attempt(quiz_id: UUID, req: QuizAttemptReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    correct_count = 0
    explanations = {}
    
    for q in quiz.questions:
        q_id_str = str(q.id)
        selected = req.answers.get(q_id_str)
        if selected == q.correct_answer:
            correct_count += 1
        explanations[q_id_str] = q.explanation
            
    score = (correct_count / quiz.total_questions) * 100 if quiz.total_questions > 0 else 0
    
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        answers=req.answers,
        time_taken_seconds=req.time_taken_seconds
    )
    db.add(attempt)

    # Auto-log study time from quiz
    from app.models.progress import StudyLog
    from datetime import date
    today = date.today()
    hours_spent = round(req.time_taken_seconds / 3600, 2)
    existing_log = db.query(StudyLog).filter(
        StudyLog.user_id == current_user.id,
        StudyLog.date == today
    ).first()
    if existing_log:
        existing_log.hours_studied += hours_spent
        topics = existing_log.topics or []
        if quiz.topic and quiz.topic not in topics:
            existing_log.topics = topics + [quiz.topic]
    else:
        db.add(StudyLog(
            user_id=current_user.id,
            date=today,
            hours_studied=hours_spent,
            topics=[quiz.topic] if quiz.topic else [],
            notes=f"Tự động ghi từ bài quiz: {quiz.title}"
        ))

    # Gamification: Reward based on score (50 XP base + score/2)
    exp = 50 + int(score * 0.5)
    log_user_activity(db, current_user.id, exp_reward=exp)

    db.commit()
    
    return {
        "score": score,
        "correct_answers": correct_count,
        "explanations": explanations
    }

@router.get("/{quiz_id}/attempts")
def get_quiz_attempts(quiz_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.completed_at.desc()).all()
    return [{"id": str(a.id), "score": a.score, "time_taken_seconds": a.time_taken_seconds, "completed_at": a.completed_at.isoformat()} for a in attempts]

@router.get("/{quiz_id}/attempts/{attempt_id}")
def get_quiz_attempt_details(quiz_id: UUID, attempt_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id, QuizAttempt.user_id == current_user.id).first()
    
    if not quiz or not attempt:
        raise HTTPException(status_code=404, detail="Not found")
        
    details = []
    for q in quiz.questions:
        user_answer = attempt.answers.get(str(q.id))
        is_correct = user_answer == q.correct_answer
        details.append({
            "question_text": q.question,
            "options": {chr(65+i): opt for i, opt in enumerate(q.options)},
            "user_answer": chr(65+user_answer) if user_answer is not None else None,
            "correct_answer": chr(65+q.correct_answer),
            "is_correct": is_correct,
            "explanation": q.explanation
        })
        
    return {
        "score": attempt.score,
        "time_taken_seconds": attempt.time_taken_seconds,
        "details": details
    }

@router.get("/attempts/stats", response_model=QuizStatsResponse)
def get_quiz_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).order_by(QuizAttempt.completed_at.desc()).all()
    
    total = len(attempts)
    avg_score = sum(a.score for a in attempts) / total if total > 0 else 0
    best_score = max((a.score for a in attempts), default=0)
    
    recent = [{"quiz_id": str(a.quiz_id), "score": a.score, "date": a.completed_at.isoformat()} for a in attempts[:5]]
    
    return {
        "total_attempts": total,
        "avg_score": avg_score,
        "best_score": best_score,
        "recent_attempts": recent
    }
