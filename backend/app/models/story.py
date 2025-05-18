import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID # For PostgreSQL UUID type
from sqlalchemy.sql import func
import datetime

from app.db.base import Base # Correct import for Base
from app.schemas.story import StoryGraph # For type hinting graph_json, though it will be stored as JSON/Text

class Story(Base):
    __tablename__ = "stories"

    # Using String for ID to store UUID, or use native UUID for PG
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Store the complex graph structure as JSON.
    # For SQLite, JSON type might map to TEXT. For PostgreSQL, it's a native JSONB/JSON.
    graph_json = Column(JSON, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User", back_populates="stories")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now()) 