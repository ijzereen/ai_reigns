# app/schemas/__init__.py
from .common import Msg, TimestampModel, OrmBaseModel # common.py 임포트 확인
from .user_schema import UserBase, UserCreate, UserUpdate, UserRead
from .stat_schema import StatBase, StatCreate, StatUpdate, StatRead
from .prompt_schema import PromptBase, PromptCreate, PromptUpdate, PromptRead, PromptType
from .node_schema import NodeBase, NodeCreate, NodeUpdate, NodeRead, NodeType
from .story_schema import StoryBase, StoryCreate, StoryUpdate, StoryRead

# Pydantic v1의 경우, 순환 참조하는 모델들에 대해 update_forward_refs() 호출 필요
# Pydantic v2에서는 일반적으로 Postponed Annotations (from __future__ import annotations)
# 또는 typing.ForwardRef를 사용하여 처리하거나, 모델이 모두 로드된 후 처리합니다.
# FastAPI에서는 대부분 자동으로 처리해주는 경우가 많습니다.

# 예시 (필요한 경우, 각 스키마 파일 하단이나 여기서 한 번에 처리):
# StoryRead.update_forward_refs(
#     UserRead=UserRead,
#     NodeRead=NodeRead,
#     StatRead=StatRead
# )
# UserRead.update_forward_refs(
#     StoryRead=StoryRead # StoryRead를 UserRead에서 사용한다면
# )
# NodeRead.update_forward_refs(
#     PromptRead=PromptRead # PromptRead를 NodeRead에서 사용한다면
# )

__all__ = [
    "Msg",
    "TimestampModel",
    "OrmBaseModel",
    "UserBase", "UserCreate", "UserUpdate", "UserRead",
    "StatBase", "StatCreate", "StatUpdate", "StatRead",
    "PromptBase", "PromptCreate", "PromptUpdate", "PromptRead", "PromptType",
    "NodeBase", "NodeCreate", "NodeUpdate", "NodeRead", "NodeType",
    "StoryBase", "StoryCreate", "StoryUpdate", "StoryRead",
]
