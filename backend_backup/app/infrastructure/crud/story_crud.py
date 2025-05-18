# app/infrastructure/crud/story_crud.py
# 스토리(Story) 모델에 대한 CRUD(Create, Read, Update, Delete) 연산을 정의합니다.

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json # initial_stats를 JSON 형태로 저장하기 위해 임포트

from app.domain.models.story import Story # Story 도메인 모델 임포트
from app.domain.models.stat import Stat # Stat 도메인 모델 임포트 (스토리와 함께 다룰 수 있음)
from app.domain.models.node import Node, NodeType # Node 도메인 모델 및 Enum 임포트 <--- 이 라인을 추가했습니다.
from app.domain.models.prompt import Prompt # Prompt 도메인 모델 임포트
# from app.schemas.story_schema import StoryCreate, StoryUpdate # 스키마는 Application/Presentation 계층에서 사용


# 스토리 생성 함수
def create_story(
    db: Session,
    title: str,
    description: Optional[str],
    creator_id: int,
    initial_stats: List[Dict[str, Any]], # 예: [{"name": "용기", "initial_value": 10}]
    initial_system_prompt: Optional[str] = None,
) -> Story:
    """
    새로운 스토리를 데이터베이스에 생성합니다.

    Args:
        db: 데이터베이스 세션 객체.
        title: 생성할 스토리의 제목.
        description: 스토리 설명.
        creator_id: 제작자 사용자 ID.
        initial_stats: 초기 스탯 데이터 목록.
        initial_system_prompt: 초기 시스템 프롬프트.

    Returns:
        생성된 Story 객체.
    """
    # initial_stats 데이터를 JSON 문자열로 변환하여 저장
    initial_stats_json = json.dumps(initial_stats) if initial_stats else None

    # Story 모델 인스턴스 생성
    db_story = Story(
        title=title,
        description=description,
        creator_id=creator_id,
        initial_stats=initial_stats_json, # JSON 문자열로 저장
        initial_system_prompt=initial_system_prompt
    )

    # 세션에 추가
    db.add(db_story)
    # 데이터베이스에 반영 (INSERT 쿼리 실행)
    db.commit()
    # 데이터베이스에서 객체를 새로고침하여 자동 생성된 ID 등을 가져옵니다.
    db.refresh(db_story)
    return db_story

# 스토리 ID로 조회 함수
def get_story_by_id(db: Session, story_id: int) -> Optional[Story]:
    """
    스토리 ID로 데이터베이스에서 스토리를 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 조회할 스토리의 고유 ID.
    Returns:
        조회된 Story 객체 (찾지 못하면 None).
    """
    # Story 모델에서 id를 기준으로 필터링하여 첫 번째 결과 반환
    return db.query(Story).filter(Story.id == story_id).first()

# 제작자 ID로 스토리 목록 조회 함수 (Application Layer에서 필터링 요청)
def get_stories(db: Session, creator_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Story]:
    """
    데이터베이스에서 스토리 목록을 조회합니다 (제작자 ID 필터링 및 페이징).

    Args:
        db: 데이터베이스 세션 객체.
        creator_id: 필터링할 제작자 사용자 ID (None이면 모든 스토리).
        skip: 건너뛸 레코드 수 (페이징 시작 지점).
        limit: 가져올 최대 레코드 수 (페이징 크기).

    Returns:
        Story 객체 목록.
    """
    query = db.query(Story)
    if creator_id is not None:
        query = query.filter(Story.creator_id == creator_id)
    return query.offset(skip).limit(limit).all()


# 스토리 수정 함수
# update_data는 딕셔너리 형태로, 수정할 컬럼과 값을 포함합니다.
def update_story(db: Session, story_id: int, update_data: Dict[str, Any]) -> Optional[Story]:
    """
    스토리 ID로 스토리 정보를 수정합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 수정할 스토리의 고유 ID.
        update_data: 수정할 컬럼과 값의 딕셔너리.

    Returns:
        수정된 Story 객체 (찾지 못하면 None).
    """
    db_story = get_story_by_id(db, story_id)
    if db_story:
        for key, value in update_data.items():
            # initial_stats와 같은 특정 필드는 JSON 문자열로 변환 필요
            if key == 'initial_stats' and isinstance(value, list):
                 setattr(db_story, key, json.dumps(value))
            else:
                 setattr(db_story, key, value) # 객체의 속성 업데이트

        db.commit()
        db.refresh(db_story)
        return db_story
    return None # 스토리를 찾지 못한 경우

# 스토리 삭제 함수
def delete_story(db: Session, story_id: int) -> Optional[Story]:
    """
    스토리 ID로 데이터베이스에서 스토리를 삭제합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 삭제할 스토리의 고유 ID.

    Returns:
        삭제된 Story 객체 (찾지 못하면 None).
    """
    db_story = get_story_by_id(db, story_id)
    if db_story:
        db.delete(db_story)
        db.commit()
        return db_story
    return None # 스토리를 찾지 못한 경우

# TODO: Stat CRUD 함수 (Stat 모델에 대한 CRUD 연산)
# Stat 모델은 Story 모델과 연결되므로, story_id를 사용하여 Stat을 관리하는 함수들이 필요합니다.
def create_stat(db: Session, story_id: int, name: str, initial_value: int = 0) -> Stat:
     """새로운 스탯을 생성합니다."""
     db_stat = Stat(story_id=story_id, name=name, initial_value=initial_value)
     db.add(db_stat)
     db.commit()
     db.refresh(db_stat)
     return db_stat

def get_stats_by_story_id(db: Session, story_id: int) -> List[Stat]:
     """스토리에 속한 모든 스탯을 조회합니다."""
     return db.query(Stat).filter(Stat.story_id == story_id).all()

# TODO: Node CRUD 함수 (Node 모델에 대한 CRUD 연산)
# Node 모델은 Story 모델과 연결되므로, story_id를 사용하여 Node를 관리하는 함수들이 필요합니다.
# bulk_create_nodes, bulk_update_nodes 함수 등 프론트엔드 요구사항에 맞는 함수 구현 필요
def create_node(db: Session, story_id: int, node_data: Dict[str, Any]) -> Node:
    """단일 노드를 생성합니다."""
    db_node = Node(story_id=story_id, **node_data) # node_data 딕셔너리의 키/값으로 Node 속성 설정
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node

def get_node_by_id(db: Session, node_id: int) -> Optional[Node]:
    """노드 ID로 노드를 조회합니다."""
    return db.query(Node).filter(Node.id == node_id).first()

def get_nodes_by_story_id(db: Session, story_id: int) -> List[Node]:
    """스토리에 속한 모든 노드를 조회합니다."""
    return db.query(Node).filter(Node.story_id == story_id).all()

def bulk_create_nodes(db: Session, story_id: int, nodes_data: List[Dict[str, Any]]) -> List[Node]:
    """노드 목록을 일괄 생성합니다."""
    db_nodes = [Node(story_id=story_id, **node_data) for node_data in nodes_data]
    db.bulk_save_objects(db_nodes) # bulk_save_objects를 사용하여 효율적인 일괄 삽입
    db.commit()
    # 일괄 삽입 후에는 객체가 새로고침되지 않으므로, 필요하다면 다시 조회해야 합니다.
    # 여기서는 간단히 삽입된 객체 리스트를 반환하지만, 실제 ID 등이 필요하면 조회 로직 추가
    return db_nodes

def bulk_update_nodes(db: Session, story_id: int, nodes_data: List[Dict[str, Any]]) -> List[Node]:
    """노드 목록을 일괄 업데이트합니다."""
    # TODO: 업데이트 로직 구현. nodes_data에 id가 포함되어 있어야 합니다.
    # 각 노드 데이터를 순회하며 해당 ID의 노드를 조회하고 속성을 업데이트하는 방식
    updated_nodes = []
    for node_data in nodes_data:
        node_id = node_data.get("id")
        if node_id is not None:
            db_node = get_node_by_id(db, node_id)
            if db_node and db_node.story_id == story_id: # 해당 스토리에 속한 노드인지 확인
                 for key, value in node_data.items():
                      if key != "id": # id는 업데이트하지 않음
                           setattr(db_node, key, value)
                 updated_nodes.append(db_node)

    db.commit()
    # 업데이트된 객체들을 새로고침 (필요 시)
    for node in updated_nodes:
         db.refresh(node)

    return updated_nodes

def delete_node(db: Session, node_id: int) -> Optional[Node]:
    """노드 ID로 노드를 삭제합니다."""
    db_node = get_node_by_id(db, node_id)
    if db_node:
        db.delete(db_node)
        db.commit()
        return db_node
    return None

# TODO: Prompt CRUD 함수 (Prompt 모델에 대한 CRUD 연산)
# Prompt 모델은 Story 또는 Node 모델과 연결되므로, story_id 또는 node_id를 사용하여 Prompt를 관리하는 함수들이 필요합니다.
def create_prompt(db: Session, prompt_data: Dict[str, Any]) -> Prompt:
    """새로운 프롬프트를 생성합니다."""
    db_prompt = Prompt(**prompt_data)
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

def get_prompt_by_id(db: Session, prompt_id: int) -> Optional[Prompt]:
    """프롬프트 ID로 프롬프트를 조회합니다."""
    return db.query(Prompt).filter(Prompt.id == prompt_id).first()

def get_prompts_by_story_id(db: Session, story_id: int) -> List[Prompt]:
    """스토리에 속한 모든 프롬프트를 조회합니다."""
    return db.query(Prompt).filter(Prompt.story_id == story_id).all()

# TODO: 엣지(NodeLink 또는 Edge) CRUD 함수 (노드 간 연결 관리를 위한 모델이 있다면 필요)
# 노드 간 연결을 별도의 테이블로 관리한다면 해당 모델에 대한 CRUD 함수를 여기에 추가합니다.
# 예: create_node_link, get_node_links_by_story_id, bulk_update_node_links 등
