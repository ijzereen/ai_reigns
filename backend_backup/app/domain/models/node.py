# app/domain/models/node.py
import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from .base import Base, TimestampedModel

class NodeType(str, enum.Enum):
    """
    노드의 유형을 정의합니다.
    START: 이야기의 시작을 나타내는 특별한 노드
    STORY: 일반적인 이야기 서술 노드
    QUESTION: 사용자에게 선택지를 제공하거나 답변을 요구하는 질문 노드
    AI_STORY: LLM에 의해 동적으로 생성되는 이야기 노드
    """
    START = "START" # 새로운 시작 노드 타입
    STORY = "STORY"
    QUESTION = "QUESTION"
    AI_STORY = "AI_STORY"

class Node(TimestampedModel):
    __tablename__ = "nodes"

    title = Column(String(255), nullable=True, comment="에디터에서 노드를 쉽게 식별하기 위한 제목")
    node_type = Column(SQLAlchemyEnum(NodeType), nullable=False, default=NodeType.STORY)
    text_content = Column(Text, nullable=True, comment="노드의 서술 텍스트 또는 질문 내용 (START 노드의 경우 초기 설명)")
    
    choices = Column(JSON, nullable=True, comment='선택지 정보. 예: [{"text": "왼쪽으로 간다", "next_node_id": 2, "stat_effects": {"용기": 10}}]') 
    
    llm_prompt_for_next_node_generation = Column(Text, nullable=True, comment="이 노드 이후 LLM이 다음 노드를 생성해야 할 경우, 그 생성을 위한 프롬프트")

    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    story = relationship("Story", back_populates="nodes", foreign_keys="Node.story_id") # Story 모델의 foreign_keys와 일치 확인

    prompts = relationship("Prompt", back_populates="node", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Node(id={self.id}, title='{self.title}', type='{self.node_type.value}', story_id={self.story_id})>"
