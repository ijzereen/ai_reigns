# app/schemas/story_schema.py
from typing import Optional, List, Dict, Any
from pydantic import Field

from .common import OrmBaseModel, TimestampModel
# from .node_schema import NodeRead # 필요시 순환 참조 처리 후 사용

class StoryBase(OrmBaseModel):
    title: str = Field(..., min_length=1, example="잊혀진 왕국의 비밀", description="스토리 또는 게임의 제목")
    description: Optional[str] = Field(None, example="고대 예언에 따라 잊혀진 왕국의 숨겨진 보물을 찾아 떠나는 모험가의 이야기입니다.", description="스토리에 대한 간략한 설명")
    system_prompt: Optional[str] = Field(
        None, 
        example="이 이야기는 중세 판타지 배경이며, 주인공은 재치 있지만 겁이 많은 모험가입니다. 전체적으로 유머러스하면서도 긴장감 있는 분위기를 유지해주세요.",
        description="LLM이 전체 스토리 흐름을 참고할 수 있는 초기 시스템 프롬프트"
    )
    initial_stats: Optional[Dict[str, Any]] = Field(
        None, 
        example={"지혜": 30, "용기": 20, "체력": 50, "금화": 100},
        description="게임 시작 시 초기 스탯 정의"
    )

class StoryCreate(StoryBase):
    pass

class StoryUpdate(OrmBaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    initial_stats: Optional[Dict[str, Any]] = None
    # start_node_id 필드 제거

class StoryRead(StoryBase, TimestampModel):
    user_id: int = Field(..., description="이 스토리를 생성한 사용자의 ID")
    # start_node_id 필드 제거
    
    # nodes: List["NodeRead"] = [] # 필요시 포함 (순환 참조 주의)
    # stats_config: List["StatRead"] = [] # 필요시 포함 (순환 참조 주의)
