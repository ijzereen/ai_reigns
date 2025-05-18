# app/schemas/node_schema.py
import enum
from typing import Optional, List, Dict, Any
from pydantic import Field

from .common import OrmBaseModel, TimestampModel

class NodeType(str, enum.Enum):
    START = "START" # 새로운 시작 노드 타입
    STORY = "STORY"
    QUESTION = "QUESTION"
    AI_STORY = "AI_STORY"

class NodeBase(OrmBaseModel):
    title: Optional[str] = Field(None, example="이야기의 시작", description="노드의 제목")
    node_type: NodeType = Field(NodeType.STORY, example=NodeType.START, description="노드의 유형 (START, STORY, QUESTION, AI_STORY)")
    text_content: Optional[str] = Field(None, example="모험이 시작되는 장소에 대한 설명입니다.", description="노드의 서술 텍스트 또는 질문 내용")
    
    choices: Optional[List[Dict[str, Any]]] = Field(
        None, 
        example=[
            {"text": "모험을 시작한다.", "next_node_id": 2}
        ],
        description="선택지 목록 (QUESTION 노드용, 또는 START/STORY 노드의 단일 다음 경로 지정용)"
    )
    
    llm_prompt_for_next_node_generation: Optional[str] = Field(
        None, 
        example="플레이어가 모험을 시작했습니다. 어떤 흥미로운 사건이 발생할까요?",
        description="이 노드 이후 LLM이 다음 노드를 생성해야 할 경우, 그 생성을 위한 프롬프트"
    )

class NodeCreate(NodeBase):
    pass

class NodeUpdate(OrmBaseModel):
    title: Optional[str] = None
    node_type: Optional[NodeType] = None # 시작 노드 타입을 변경하는 것은 주의 필요
    text_content: Optional[str] = None
    choices: Optional[List[Dict[str, Any]]] = None
    llm_prompt_for_next_node_generation: Optional[str] = None

class NodeRead(NodeBase, TimestampModel):
    story_id: int = Field(..., description="이 노드가 속한 스토리의 ID")
