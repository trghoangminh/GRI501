import json
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.roadmap import Roadmap, Milestone
from app.core.llm import get_llm
from fastapi import HTTPException

ROADMAP_SYSTEM_PROMPT = """You are an expert learning coach. Generate a detailed, realistic study roadmap.
Return ONLY valid JSON, no markdown, no explanation."""

def generate_roadmap_json(user: User) -> dict:
    prompt = f"""Create a study roadmap for:
- Goal: {user.learning_goal or 'Not specified'}
- Current level: {user.current_level or 'Beginner'}
- Available time: {user.hours_per_week or 5} hours/week
- Deadline: {user.deadline or 'Not specified'}

Return JSON:
{{
  "title": "roadmap title",
  "description": "brief overview",
  "milestones": [
    {{
      "title": "milestone title",
      "description": "what to learn",
      "estimated_days": 7,
      "order_index": 0,
      "resources": [{{"title": "resource name", "url": "https://..."}}]
    }}
  ]
}}"""
    llm = get_llm(temperature=0.7)
    messages = [
        ("system", ROADMAP_SYSTEM_PROMPT),
        ("human", prompt)
    ]
    response = llm.invoke(messages)
    
    # Parse JSON from response
    try:
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response into JSON")

def create_roadmap(db: Session, user: User) -> Roadmap:
    # Generate JSON
    roadmap_data = generate_roadmap_json(user)
    
    # Save Roadmap
    roadmap = Roadmap(
        user_id=user.id,
        title=roadmap_data.get("title", "Study Roadmap"),
        description=roadmap_data.get("description", "")
    )
    db.add(roadmap)
    db.flush() # flush to get roadmap.id
    
    # Save Milestones
    for i, m_data in enumerate(roadmap_data.get("milestones", [])):
        milestone = Milestone(
            roadmap_id=roadmap.id,
            title=m_data.get("title", ""),
            description=m_data.get("description", ""),
            estimated_days=m_data.get("estimated_days", 7),
            order_index=m_data.get("order_index", i),
            resources=m_data.get("resources", [])
        )
        db.add(milestone)
        
    db.commit()
    db.refresh(roadmap)
    return roadmap

def get_current_roadmap(db: Session, user_id: UUID) -> Roadmap | None:
    return db.query(Roadmap).filter(Roadmap.user_id == user_id, Roadmap.status == "active").first()
