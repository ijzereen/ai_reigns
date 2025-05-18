from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.infrastructure.crud.stat_crud import stat_crud
from app.infrastructure.crud.story_crud import story_crud # 스탯이 속한 스토리 검증용
from app.domain.models.stat import Stat
from app.domain.models.user import User # 권한 검사용
from app.schemas.stat_schema import StatCreate, StatUpdate

class StatService:
    def create_stat_config(self, db: Session, *, stat_in: StatCreate, story_id: int, current_user: User) -> Stat:
        story = story_crud.get(db, id=story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="스탯을 추가할 스토리를 찾을 수 없습니다.")
        if story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스토리에 스탯을 추가할 권한이 없습니다.")
        existing_stat = stat_crud.get_by_name_and_story(db, name=stat_in.name, story_id=story_id)
        if existing_stat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"스토리 내에 이미 '{stat_in.name}' 스탯이 존재합니다.")
        stat_data = stat_in.model_dump()
        db_obj_stat = Stat(**stat_data, story_id=story_id)
        db.add(db_obj_stat)
        db.commit()
        db.refresh(db_obj_stat)
        return db_obj_stat

    def get_stat_config(self, db: Session, stat_id: int, current_user: User) -> Optional[Stat]:
        stat = stat_crud.get(db, id=stat_id)
        if not stat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="스탯 설정을 찾을 수 없습니다.")
        story = story_crud.get(db, id=stat.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스탯 설정에 접근할 권한이 없습니다.")
        return stat

    def get_stats_by_story(self, db: Session, story_id: int, current_user: User, skip: int = 0, limit: int = 10) -> List[Stat]:
        story = story_crud.get(db, id=story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="스토리를 찾을 수 없습니다.")
        if story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스토리의 스탯 설정에 접근할 권한이 없습니다.")
        return stat_crud.get_multi_by_story(db, story_id=story_id, skip=skip, limit=limit)

    def update_stat_config(self, db: Session, *, stat_id: int, stat_in: StatUpdate, current_user: User) -> Optional[Stat]:
        db_stat = stat_crud.get(db, id=stat_id)
        if not db_stat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="업데이트할 스탯 설정을 찾을 수 없습니다.")
        story = story_crud.get(db, id=db_stat.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스탯 설정을 수정할 권한이 없습니다.")
        return stat_crud.update(db, db_obj=db_stat, obj_in=stat_in)

    def delete_stat_config(self, db: Session, stat_id: int, current_user: User) -> Optional[Stat]:
        db_stat = stat_crud.get(db, id=stat_id)
        if not db_stat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 스탯 설정을 찾을 수 없습니다.")
        story = story_crud.get(db, id=db_stat.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스탯 설정을 삭제할 권한이 없습니다.")
        return stat_crud.remove(db, id=stat_id)

stat_service = StatService()