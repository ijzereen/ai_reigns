# app/domain/models/prompt.py
import enum # PromptType 정의를 위해 추가
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func # TimestampedModel에서 사용
from .base import Base, TimestampedModel

# Node 모델을 문자열로 참조
# from .node import Node

class PromptType(str, enum.Enum):
    """
    프롬프트의 유형을 정의합니다.
    NODE_GENERATION: 새로운 스토리 노드 생성을 위한 프롬프트
    ROUTING: 사용자의 답변을 분석하여 다음 노드로 안내하기 위한 라우팅 조건 프롬프트
    STAT_ADJUSTMENT: 특정 상황이나 선택에 따라 스탯을 조정하기 위한 프롬프트
    """
    NODE_GENERATION = "NODE_GENERATION"
    ROUTING = "ROUTING"
    STAT_ADJUSTMENT = "STAT_ADJUSTMENT"

class Prompt(TimestampedModel):
    """
    LLM 프롬프트 모델
    """
    __tablename__ = "prompts"

    # id, created_at, updated_at는 TimestampedModel에서 상속
    prompt_text = Column(Text, nullable=False, comment="LLM에게 전달될 실제 프롬프트 내용")
    prompt_type = Column(SQLAlchemyEnum(PromptType), nullable=False)
    
    node_id = Column(Integer, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True)
    node = relationship("Node", back_populates="prompts")

    # routing_conditions 필드는 초기 설계에 있었으나, PromptType.ROUTING의 prompt_text에 내용을 포함시키거나,
    # 필요시 JSON 필드로 다시 추가할 수 있습니다. 여기서는 일단 제외하고, 필요시 확장합니다.

    def __repr__(self):
        return f"<Prompt(id={self.id}, type='{self.prompt_type.value}', node_id={self.node_id})>"
