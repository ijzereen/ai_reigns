# app/infrastructure/crud/stat_crud.py
# 스탯(Stat) 모델에 대한 CRUD(Create, Read, Update, Delete) 연산을 정의합니다.

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.domain.models.stat import Stat # Stat 도메인 모델 임포트
from app.domain.models.story import Story # Stat은 Story에 속하므로 Story 모델도 임포트

# 스탯 생성 함수
def create_stat(db: Session, story_id: int, name: str, initial_value: int = 0) -> Stat:
    """
    새로운 스탯을 데이터베이스에 생성합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 이 스탯이 속한 스토리의 ID.
        name: 생성할 스탯의 이름.
        initial_value: 스탯의 초기 값.

    Returns:
        생성된 Stat 객체.
    """
    # Stat 모델 인스턴스 생성
    db_stat = Stat(story_id=story_id, name=name, initial_value=initial_value)

    # 세션에 추가
    db.add(db_stat)
    # 데이터베이스에 반영 (INSERT 쿼리 실행)
    db.commit()
    # 데이터베이스에서 객체를 새로고침하여 자동 생성된 ID 등을 가져옵니다.
    db.refresh(db_stat)
    return db_stat

# 스탯 ID로 조회 함수
def get_stat_by_id(db: Session, stat_id: int) -> Optional[Stat]:
    """
    스탯 ID로 데이터베이스에서 스탯을 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        stat_id: 조회할 스탯의 고유 ID.

    Returns:
        조회된 Stat 객체 (찾지 못하면 None).
    """
    # Stat 모델에서 id를 기준으로 필터링하여 첫 번째 결과 반환
    return db.query(Stat).filter(Stat.id == stat_id).first()

# 스토리에 속한 모든 스탯 조회 함수
def get_stats_by_story_id(db: Session, story_id: int) -> List[Stat]:
    """
    스토리에 속한 모든 스탯을 데이터베이스에서 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 스탯을 조회할 스토리의 ID.

    Returns:
        Stat 객체 목록.
    """
    # Stat 모델에서 story_id를 기준으로 필터링하여 모든 결과 반환
    return db.query(Stat).filter(Stat.story_id == story_id).all()

# 스탯 수정 함수
# update_data는 딕셔너리 형태로, 수정할 컬럼과 값을 포함합니다.
def update_stat(db: Session, stat_id: int, update_data: Dict[str, Any]) -> Optional[Stat]:
    """
    스탯 ID로 스탯 정보를 수정합니다.

    Args:
        db: 데이터베이스 세션 객체.
        stat_id: 수정할 스탯의 고유 ID.
        update_data: 수정할 컬럼과 값의 딕셔너리.

    Returns:
        수정된 Stat 객체 (찾지 못하면 None).
    """
    db_stat = get_stat_by_id(db, stat_id)
    if db_stat:
        for key, value in update_data.items():
            setattr(db_stat, key, value) # 객체의 속성 업데이트

        db.commit()
        db.refresh(db_stat)
        return db_stat
    return None # 스탯을 찾지 못한 경우


# 스탯 삭제 함수
def delete_stat(db: Session, stat_id: int) -> Optional[Stat]:
    """
    스탯 ID로 데이터베이스에서 스탯을 삭제합니다.

    Args:
        db: 데이터베이스 세션 객체.
        stat_id: 삭제할 스탯의 고유 ID.

    Returns:
        삭제된 Stat 객체 (찾지 못하면 None).
    """
    db_stat = get_stat_by_id(db, stat_id)
    if db_stat:
        db.delete(db_stat)
        db.commit()
        return db_stat
    return None # 스탯을 찾지 못한 경우

# TODO: 스탯 일괄 생성/업데이트/삭제 함수 (필요 시 추가)
# 프론트엔드에서 스탯 목록을 한 번에 관리한다면 유용할 수 있습니다.
