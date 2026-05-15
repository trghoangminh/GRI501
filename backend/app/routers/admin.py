from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.quiz import Quiz, QuizAttempt
from app.models.document import Document
from app.models.progress import StudyLog
from app.core.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_roadmaps = db.query(Roadmap).count()
    total_quizzes = db.query(Quiz).count()
    total_documents = db.query(Document).count()
    total_quiz_attempts = db.query(QuizAttempt).count()

    # New users in the last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_this_week = db.query(User).filter(User.created_at >= week_ago).count()

    # Total study hours logged
    total_study_hours = db.query(func.sum(StudyLog.hours_studied)).scalar() or 0

    return {
        "status": "success",
        "data": {
            "total_users": total_users,
            "active_users": active_users,
            "total_roadmaps": total_roadmaps,
            "total_quizzes": total_quizzes,
            "total_documents": total_documents,
            "total_quiz_attempts": total_quiz_attempts,
            "new_users_this_week": new_users_this_week,
            "total_study_hours": round(float(total_study_hours), 1)
        }
    }


@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    users = db.query(User).order_by(User.created_at.desc()).all()

    user_data = []
    for u in users:
        roadmap_count = db.query(Roadmap).filter(Roadmap.user_id == u.id).count()
        user_data.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "learning_goal": u.learning_goal,
            "current_level": u.current_level,
            "roadmap_count": roadmap_count,
        })

    return {"status": "success", "data": user_data}


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return {"status": "success", "data": {"is_active": user.is_active}}


@router.patch("/users/{user_id}/role")
def update_user_role(user_id: str, role: str, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"status": "success", "message": f"Role updated to {role}"}
