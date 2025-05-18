# app/domain/models/story.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON # DateTime 제거 (TimestampedModel에서 상속)
from sqlalchemy.orm import relationship
from .base import Base, TimestampedModel

class Story(TimestampedModel):
    __tablename__ = "stories"

    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User", back_populates="stories")

    system_prompt = Column(Text, nullable=True, comment="LLM이 전체 스토리 흐름을 참고할 수 있는 초기 시스템 프롬프트")
    initial_stats = Column(JSON, nullable=True, comment="게임 시작 시 초기 스탯 정의 (예: {'평판': 50, '재정': 100})")
    
    # start_node_id 및 start_node 관계 제거
    # nodes 관계는 유지 (한 스토리에 여러 노드가 속함)
    nodes = relationship("Node", back_populates="story", cascade="all, delete-orphan", foreign_keys="Node.story_id")
    stats_config = relationship("Stat", back_populates="story", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Story(id={self.id}, title='{self.title}', user_id={self.user_id})>"
