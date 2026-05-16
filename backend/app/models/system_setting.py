from sqlalchemy import Column, String, Boolean
from app.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Boolean, default=True)
    description = Column(String, nullable=True)
