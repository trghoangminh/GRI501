from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.roadmap import Roadmap, Milestone
from app.schemas.roadmap import RoadmapResponse, MilestoneUpdate, MilestoneResponse
from app.core.dependencies import get_current_user
from app.services.roadmap_service import create_roadmap, get_current_roadmap

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

@router.post("/generate", response_model=RoadmapResponse)
def generate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # If user already has an active roadmap, archive it or block? 
    # Spec says POST /regenerate drops old one, so /generate should create new or return existing.
    existing = get_current_roadmap(db, current_user.id)
    if existing:
        return existing
        
    roadmap = create_roadmap(db, current_user)
    return roadmap

@router.get("/", response_model=RoadmapResponse)
def get_roadmap(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmap = get_current_roadmap(db, current_user.id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found")
    return roadmap

@router.post("/regenerate", response_model=RoadmapResponse)
def regenerate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = get_current_roadmap(db, current_user.id)
    if existing:
        existing.status = "archived"
        db.commit()
        
    roadmap = create_roadmap(db, current_user)
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
    db.commit()
    db.refresh(milestone)
    return milestone
