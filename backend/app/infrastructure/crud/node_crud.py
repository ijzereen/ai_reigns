# app/infrastructure/crud/node_crud.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.domain.models.node import Node
from app.schemas.node_schema import NodeCreate, NodeUpdate # 스키마 임포트
from .base_crud import CRUDBase

class CRUDNode(CRUDBase[Node, NodeCreate, NodeUpdate]):
    def get_multi_by_story(
        self, db: Session, *, story_id: int, skip: int = 0, limit: int = 1000 # 노드는 한 스토리에 많을 수 있으므로 limit 증가
    ) -> List[Node]:
        """특정 스토리에 속한 노드 목록을 조회합니다."""
        return (
            db.query(self.model)
            .filter(Node.story_id == story_id)
            .order_by(Node.id) # 생성 순서 등으로 정렬 가능
            .offset(skip)
            .limit(limit)
            .all()
        )

node_crud = CRUDNode(Node)
