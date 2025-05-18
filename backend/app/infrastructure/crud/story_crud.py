# app/infrastructure/crud/story_crud.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.domain.models.story import Story
from app.schemas.story_schema import StoryCreate, StoryUpdate # 스키마 임포트
from .base_crud import CRUDBase

class CRUDStory(CRUDBase[Story, StoryCreate, StoryUpdate]):
    def get_by_title(self, db: Session, *, title: str, user_id: int) -> Optional[Story]:
        """특정 사용자의 스토리 제목을 기준으로 스토리를 조회합니다."""
        return db.query(Story).filter(Story.title == title, Story.user_id == user_id).first()

    def get_multi_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Story]:
        """특정 사용자가 생성한 스토리 목록을 조회합니다."""
        return (
            db.query(self.model)
            .filter(Story.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

story_crud = CRUDStory(Story)
