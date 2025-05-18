# app/infrastructure/crud/stat_crud.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.domain.models.stat import Stat
from app.schemas.stat_schema import StatCreate, StatUpdate # 스키마 임포트
from .base_crud import CRUDBase

class CRUDStat(CRUDBase[Stat, StatCreate, StatUpdate]):
    def get_by_name_and_story(
        self, db: Session, *, name: str, story_id: int
    ) -> Optional[Stat]:
        """특정 스토리 내에서 스탯 이름을 기준으로 스탯 설정을 조회합니다."""
        return db.query(Stat).filter(Stat.name == name, Stat.story_id == story_id).first()

    def get_multi_by_story(
        self, db: Session, *, story_id: int, skip: int = 0, limit: int = 10
    ) -> List[Stat]:
        """특정 스토리에 정의된 스탯 설정 목록을 조회합니다."""
        return (
            db.query(self.model)
            .filter(Stat.story_id == story_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

stat_crud = CRUDStat(Stat)
