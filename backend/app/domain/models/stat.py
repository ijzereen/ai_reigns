# app/domain/models/stat.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func # TimestampedModel에서 사용
from .base import Base, TimestampedModel

# Story 모델을 문자열로 참조
# from .story import Story

class Stat(TimestampedModel):
    """
    게임 스탯 정의 모델
    한 이야기에 여러 스탯이 정의될 수 있음 (예: 평판, 재정, 건강 등)
    """
    __tablename__ = "stats"

    # id, created_at, updated_at는 TimestampedModel에서 상속
    name = Column(String(100), nullable=False, comment="스탯의 이름 (예: '평판', '재정')")
    description = Column(Text, nullable=True, comment="스탯에 대한 설명")
    initial_value = Column(Integer, nullable=False, default=0, comment="해당 스탯의 기본 시작 값")
    min_value = Column(Integer, nullable=True, default=0)
    max_value = Column(Integer, nullable=True, default=100)

    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    story = relationship("Story", back_populates="stats_config")

    def __repr__(self):
        return f"<Stat(id={self.id}, name='{self.name}', story_id={self.story_id})>"
