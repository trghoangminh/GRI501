from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, Dict
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.quiz import Quiz, QuizAttempt
from app.models.document import Document
from app.models.progress import StudyLog
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from fastapi.responses import FileResponse
from app.models.chat import ChatSession, ChatMessage
from app.core.dependencies import get_admin_user
from app.services.settings_service import get_all_settings, update_settings
from app.services.rag_service import delete_document_vectors
import os
from uuid import UUID

router = APIRouter(prefix="/admin", tags=["admin"])

class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, bool]


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


@router.get("/settings")
def get_admin_settings(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    settings = get_all_settings(db)
    return {"status": "success", "data": settings}


@router.post("/settings")
def update_admin_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    update_settings(db, payload.settings)
    return {"status": "success", "message": "Settings updated successfully"}

@router.get("/system")
def get_system_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    try:
        import psutil
        cpu_percent = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "status": "success",
            "data": {
                "cpu_usage": cpu_percent,
                "ram_total": ram.total,
                "ram_used": ram.used,
                "ram_percent": ram.percent,
                "disk_total": disk.total,
                "disk_used": disk.used,
                "disk_percent": disk.percent
            }
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="psutil is not installed")

@router.get("/logs")
def get_server_logs(lines: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    import os
    log_path = "logs/server.log"
    if not os.path.exists(log_path):
        return {"status": "success", "data": "Log file not found or empty."}
        
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.readlines()
        
        # Get last N lines
        last_lines = content[-lines:]
        return {"status": "success", "data": "".join(last_lines)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
def get_all_documents(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    docs = db.query(Document, User).join(User, Document.user_id == User.id).order_by(Document.created_at.desc()).all()
    
    results = []
    for doc, user in docs:
        file_path = doc.file_path
        is_missing = True
        file_size = 0
        
        if file_path and os.path.exists(file_path):
            is_missing = False
            file_size = os.path.getsize(file_path)
            
        results.append({
            "id": str(doc.id),
            "original_name": doc.original_name,
            "file_type": doc.file_type,
            "status": doc.status,
            "chunk_count": doc.chunk_count,
            "created_at": doc.created_at,
            "uploader_email": user.email,
            "uploader_name": user.full_name,
            "is_missing": is_missing,
            "file_size_kb": round(file_size / 1024, 2),
            "summary": doc.summary
        })
        
    return {"status": "success", "data": results}

@router.delete("/documents/{document_id}")
def admin_delete_document(document_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove vectors
    try:
        delete_document_vectors(document_id)
    except Exception as e:
        print(f"Failed to delete document vectors: {e}")
    
    # Remove physical file
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            print(f"Failed to delete physical file: {e}")
            
    db.delete(document)
    db.commit()
    
    return {"status": "success", "message": "Document deleted successfully"}

@router.get("/documents/{document_id}/download")
def admin_download_document(document_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document or not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(
        path=document.file_path,
        filename=document.original_name,
        media_type="application/octet-stream"
    )

@router.get("/chats")
def get_all_chats(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    sessions = db.query(ChatSession, User).join(User, ChatSession.user_id == User.id).order_by(ChatSession.updated_at.desc()).limit(100).all()
    
    results = []
    for session, user in sessions:
        msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()
        results.append({
            "id": str(session.id),
            "title": session.title,
            "user_email": user.email,
            "user_name": user.full_name,
            "message_count": msg_count,
            "created_at": session.created_at,
            "updated_at": session.updated_at
        })
    return {"status": "success", "data": results}

@router.get("/chats/{session_id}")
def get_chat_messages(session_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    
    results = []
    for msg in messages:
        results.append({
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at
        })
    return {"status": "success", "data": results}

@router.post("/broadcast")
def broadcast_notification(
    notif_in: NotificationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_admin_user)
):
    users = db.query(User).filter(User.role != "admin").all()
    count = 0
    for u in users:
        db.add(Notification(
            user_id=u.id, 
            type="admin", 
            title=notif_in.title, 
            message=notif_in.message
        ))
        count += 1
    db.commit()
    return {"status": "success", "users_notified": count}
