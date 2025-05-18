# app/infrastructure/crud/prompt_crud.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.domain.models.prompt import Prompt
from app.schemas.prompt_schema import PromptCreate, PromptUpdate # 스키마 임포트
from .base_crud import CRUDBase

class CRUDPrompt(CRUDBase[Prompt, PromptCreate, PromptUpdate]):
    def get_multi_by_node(
        self, db: Session, *, node_id: int, skip: int = 0, limit: int = 100
    ) -> List[Prompt]:
        """특정 노드에 연관된 프롬프트 목록을 조회합니다."""
        return (
            db.query(self.model)
            .filter(Prompt.node_id == node_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

prompt_crud = CRUDPrompt(Prompt)
