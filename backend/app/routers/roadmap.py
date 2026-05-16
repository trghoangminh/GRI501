from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.roadmap import Roadmap, Milestone
from app.schemas.roadmap import RoadmapResponse, MilestoneUpdate, MilestoneResponse, RoadmapGenerateRequest
from app.core.dependencies import get_current_user
from app.services.roadmap_service import create_roadmap, get_current_roadmap
from app.services.settings_service import get_setting_value
from app.services.gamification_service import log_user_activity

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

@router.post("/generate", response_model=RoadmapResponse)
def generate(request: RoadmapGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not get_setting_value(db, "llm_enabled"):
        raise HTTPException(status_code=403, detail="Tính năng AI/LLM hiện đang bị vô hiệu hóa.")
    
    existing = get_current_roadmap(db, current_user.id)
    if existing:
        existing.status = "archived"
        db.commit()
        
    roadmap = create_roadmap(db, current_user, request)
    return roadmap

@router.get("/", response_model=RoadmapResponse)
def get_roadmap(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmap = get_current_roadmap(db, current_user.id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found")
    return roadmap

@router.post("/regenerate", response_model=RoadmapResponse)
def regenerate(request: RoadmapGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not get_setting_value(db, "llm_enabled"):
        raise HTTPException(status_code=403, detail="Tính năng AI/LLM hiện đang bị vô hiệu hóa.")

    existing = get_current_roadmap(db, current_user.id)
    if existing:
        existing.status = "archived"
        db.commit()
        
    roadmap = create_roadmap(db, current_user, request)
    return roadmap

@router.get("/archived")
def get_archived(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmaps = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "archived"
    ).order_by(Roadmap.created_at.desc()).all()
    return roadmaps

@router.post("/{roadmap_id}/restore", response_model=RoadmapResponse)
def restore(roadmap_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Archive current active roadmap if exists
    current = get_current_roadmap(db, current_user.id)
    if current:
        current.status = "archived"
    # Restore the requested one
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    roadmap.status = "active"
    db.commit()
    db.refresh(roadmap)
    return roadmap

@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    milestone_id: UUID, 
    update_data: MilestoneUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).join(Roadmap).filter(
        Milestone.id == milestone_id, 
        Roadmap.user_id == current_user.id
    ).first()
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    if update_data.status not in ["not_started", "in_progress", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    milestone.status = update_data.status
    
    # Gamification: Reward XP if milestone completed
    if update_data.status == "completed":
        log_user_activity(db, current_user.id, exp_reward=50)
        
    db.commit()
    db.refresh(milestone)
    return milestone
