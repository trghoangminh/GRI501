import functools
from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting
from app.database import SessionLocal

# Default settings map
DEFAULT_SETTINGS = {
    "maintenance": {"value": False, "description": "Chế độ bảo trì"},
    "registration": {"value": True, "description": "Mở Đăng ký"},
    "llm_enabled": {"value": True, "description": "Tính năng LLM"},
    "rag_enabled": {"value": True, "description": "Tìm kiếm tài liệu RAG"},
    "quiz_generation": {"value": True, "description": "Tự động tạo câu hỏi"},
    "email_notifications": {"value": False, "description": "Thông báo Email"},
}

def get_setting_value(db: Session, key: str) -> bool:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting is not None:
        return setting.value
    # Fallback to default
    if key in DEFAULT_SETTINGS:
        return DEFAULT_SETTINGS[key]["value"]
    return False

def get_all_settings(db: Session) -> dict:
    settings = db.query(SystemSetting).all()
    db_map = {s.key: s.value for s in settings}
    
    result = {}
    for key, default_info in DEFAULT_SETTINGS.items():
        result[key] = {
            "label": default_info["description"],
            "description": default_info["description"],
            "value": db_map.get(key, default_info["value"])
        }
    return result

def update_settings(db: Session, updates: dict):
    for key, value in updates.items():
        if key in DEFAULT_SETTINGS:
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not setting:
                setting = SystemSetting(key=key, value=value, description=DEFAULT_SETTINGS[key]["description"])
                db.add(setting)
            else:
                setting.value = value
    db.commit()
