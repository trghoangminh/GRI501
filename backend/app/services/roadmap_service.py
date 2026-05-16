import json
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.roadmap import Roadmap, Milestone
from app.schemas.roadmap import RoadmapGenerateRequest
from app.core.llm import get_llm
from fastapi import HTTPException

ROADMAP_SYSTEM_PROMPT = """Bạn là một chuyên gia huấn luyện học tập. Hãy tạo một lộ trình học tập chi tiết, thực tế bằng TIẾNG VIỆT.
Chỉ trả về ĐÚNG ĐỊNH DẠNG JSON, không sử dụng markdown, không giải thích thêm."""

def generate_roadmap_json(request_data: RoadmapGenerateRequest) -> dict:
    prompt = f"""Create a study roadmap for:
- Goal: {request_data.learning_goal or 'Not specified'}
- Current level: {request_data.current_level or 'Beginner'}
- Available time: {request_data.hours_per_week or 5} hours/week
- Deadline: {request_data.deadline or 'Not specified'}

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
        content_raw = response.content
        if isinstance(content_raw, list):
            content = "".join([c.get("text", "") for c in content_raw if isinstance(c, dict) and "text" in c])
        else:
            content = str(content_raw)
            
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Error parsing roadmap JSON: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse LLM response into JSON")

def create_roadmap(db: Session, user: User, request_data: RoadmapGenerateRequest) -> Roadmap:
    # Generate JSON
    roadmap_data = generate_roadmap_json(request_data)
    
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
