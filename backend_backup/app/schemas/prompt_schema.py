# app/schemas/prompt_schema.py
import enum # PromptType 정의를 위해 추가
from typing import Optional, Dict, Any # Dict, Any 추가
from pydantic import Field

from .common import OrmBaseModel, TimestampModel

# Pydantic 스키마에서 사용할 Enum (domain 모델의 것과 값을 동기화)
# app.domain.models.prompt 파일의 PromptType Enum을 참조합니다.
class PromptType(str, enum.Enum):
    NODE_GENERATION = "NODE_GENERATION"
    ROUTING = "ROUTING"
    STAT_ADJUSTMENT = "STAT_ADJUSTMENT"

class PromptBase(OrmBaseModel):
    prompt_text: str = Field(..., example="플레이어가 동굴에 들어갔습니다. 어떤 위험과 마주하게 될까요?", description="LLM에게 전달될 실제 프롬프트 내용")
    prompt_type: PromptType = Field(..., example=PromptType.NODE_GENERATION, description="프롬프트의 유형")
    # 초기 설계의 '라우팅 조건'은 prompt_text에 포함시키거나, 필요시 아래와 같이 JSON 필드로 확장 가능
    # routing_conditions: Optional[Dict[str, Any]] = Field(None, example={"keywords": ["보물", "탈출"], "target_node_ids": [10, 11]})

class PromptCreate(PromptBase):
    # node_id는 API 경로 파라미터나 서비스 로직에서 주입됩니다.
    pass

class PromptUpdate(OrmBaseModel):
    prompt_text: Optional[str] = None
    prompt_type: Optional[PromptType] = None
    # routing_conditions: Optional[Dict[str, Any]] = None

class PromptRead(PromptBase, TimestampModel):
    node_id: Optional[int] = Field(None, description="이 프롬프트가 연결된 노드의 ID (해당되는 경우)")

