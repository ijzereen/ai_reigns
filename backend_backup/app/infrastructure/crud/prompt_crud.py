# app/infrastructure/crud/prompt_crud.py
# 프롬프트(Prompt) 모델에 대한 CRUD(Create, Read, Update, Delete) 연산을 정의합니다.

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.domain.models.prompt import Prompt, PromptType # Prompt 도메인 모델 및 Enum 임포트
from app.domain.models.story import Story # Prompt는 Story에 속하므로 Story 모델도 임포트
from app.domain.models.node import Node # Prompt는 특정 Node와 연결될 수 있으므로 Node 모델도 임포트

# 프롬프트 생성 함수
def create_prompt(db: Session, prompt_data: Dict[str, Any]) -> Prompt:
    """
    새로운 프롬프트를 데이터베이스에 생성합니다.

    Args:
        db: 데이터베이스 세션 객체.
        prompt_data: 프롬프트의 속성 데이터 (딕셔너리).
                     예: {"story_id": 1, "node_id": 10, "prompt_type": "node_generation", "content": "다음 스토리 생성 프롬프트"}

    Returns:
        생성된 Prompt 객체.
    """
    # Prompt 모델 인스턴스 생성
    db_prompt = Prompt(**prompt_data)

    # 세션에 추가
    db.add(db_prompt)
    # 데이터베이스에 반영 (INSERT 쿼리 실행)
    db.commit()
    # 데이터베이스에서 객체를 새로고침하여 자동 생성된 ID 등을 가져옵니다.
    db.refresh(db_prompt)
    return db_prompt

# 프롬프트 ID로 조회 함수
def get_prompt_by_id(db: Session, prompt_id: int) -> Optional[Prompt]:
    """
    프롬프트 ID로 데이터베이스에서 프롬프트를 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        prompt_id: 조회할 프롬프트의 고유 ID.

    Returns:
        조회된 Prompt 객체 (찾지 못하면 None).
    """
    # Prompt 모델에서 id를 기준으로 필터링하여 첫 번째 결과 반환
    return db.query(Prompt).filter(Prompt.id == prompt_id).first()

# 스토리에 속한 모든 프롬프트 조회 함수
def get_prompts_by_story_id(db: Session, story_id: int) -> List[Prompt]:
    """
    스토리에 속한 모든 프롬프트를 데이터베이스에서 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 프롬프트를 조회할 스토리의 ID.

    Returns:
        Prompt 객체 목록.
    """
    # Prompt 모델에서 story_id를 기준으로 필터링하여 모든 결과 반환
    return db.query(Prompt).filter(Prompt.story_id == story_id).all()

# 특정 노드에 연결된 프롬프트 조회 함수 (예시)
def get_prompts_by_node_id(db: Session, node_id: int) -> List[Prompt]:
    """
    특정 노드에 연결된 모든 프롬프트를 데이터베이스에서 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        node_id: 프롬프트를 조회할 노드의 ID.

    Returns:
        Prompt 객체 목록.
    """
    # Prompt 모델에서 node_id를 기준으로 필터링하여 모든 결과 반환
    return db.query(Prompt).filter(Prompt.node_id == node_id).all()


# 프롬프트 수정 함수
# update_data는 딕셔너리 형태로, 수정할 컬럼과 값을 포함합니다.
def update_prompt(db: Session, prompt_id: int, update_data: Dict[str, Any]) -> Optional[Prompt]:
    """
    프롬프트 ID로 프롬프트 정보를 수정합니다.

    Args:
        db: 데이터베이스 세션 객체.
        prompt_id: 수정할 프롬프트의 고유 ID.
        update_data: 수정할 컬럼과 값의 딕셔너리.

    Returns:
        수정된 Prompt 객체 (찾지 못하면 None).
    """
    db_prompt = get_prompt_by_id(db, prompt_id)
    if db_prompt:
        for key, value in update_data.items():
            # PromptType Enum 값은 문자열로 받아와 Enum 객체로 변환 필요
            if key == 'prompt_type' and isinstance(value, str):
                 setattr(db_prompt, key, PromptType(value)) # 문자열을 Enum 객체로 변환
            else:
                 setattr(db_prompt, key, value) # 객체의 속성 업데이트

        db.commit()
        db.refresh(db_prompt)
        return db_prompt
    return None # 프롬프트를 찾지 못한 경우


# 프롬프트 삭제 함수
def delete_prompt(db: Session, prompt_id: int) -> Optional[Prompt]:
    """
    프롬프트 ID로 데이터베이스에서 프롬프트를 삭제합니다.

    Args:
        db: 데이터베이스 세션 객체.
        prompt_id: 삭제할 프롬프트의 고유 ID.

    Returns:
        삭제된 Prompt 객체 (찾지 못하면 None).
    """
    db_prompt = get_prompt_by_id(db, prompt_id)
    if db_prompt:
        db.delete(db_prompt)
        db.commit()
        return db_prompt
    return None # 프롬프트를 찾지 못한 경우

# TODO: 프롬프트 일괄 생성/업데이트/삭제 함수 (필요 시 추가)
# 프론트엔드에서 프롬프트 목록을 한 번에 관리한다면 유용할 수 있습니다.
