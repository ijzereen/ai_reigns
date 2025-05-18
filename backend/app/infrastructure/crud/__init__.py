# app/infrastructure/crud/__init__.py
from .user_crud import user_crud
from .story_crud import story_crud
from .node_crud import node_crud
from .stat_crud import stat_crud
from .prompt_crud import prompt_crud

# __all__ 정의는 선택 사항입니다.
# from .base_crud import CRUDBase # CRUDBase를 직접 외부에서 사용할 일은 적을 수 있습니다.

__all__ = [
    "user_crud",
    "story_crud",
    "node_crud",
    "stat_crud",
    "prompt_crud",
]
