# app/infrastructure/crud/node_crud.py
# 노드(Node) 모델에 대한 CRUD(Create, Read, Update, Delete) 연산을 정의합니다.

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.domain.models.node import Node, NodeType # Node 도메인 모델 및 Enum 임포트
# TODO: NodeLink 또는 Edge 모델이 있다면 임포트합니다.
# from app.domain.models.node_link import NodeLink

# 노드 생성 함수
def create_node(db: Session, story_id: int, node_data: Dict[str, Any]) -> Node:
    """
    새로운 노드를 데이터베이스에 생성합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 이 노드가 속한 스토리의 ID.
        node_data: 노드의 속성 데이터 (딕셔너리). 예: {"node_type": "story", "text": "이야기 내용", ...}

    Returns:
        생성된 Node 객체.
    """
    # Node 모델 인스턴스 생성
    # node_data 딕셔너리의 키/값으로 Node 속성을 설정합니다.
    # story_id는 별도로 전달받아 설정합니다.
    db_node = Node(story_id=story_id, **node_data)

    # 세션에 추가
    db.add(db_node)
    # 데이터베이스에 반영 (INSERT 쿼리 실행)
    db.commit()
    # 데이터베이스에서 객체를 새로고침하여 자동 생성된 ID 등을 가져옵니다.
    db.refresh(db_node)
    return db_node

# 노드 ID로 조회 함수
def get_node_by_id(db: Session, node_id: int) -> Optional[Node]:
    """
    노드 ID로 데이터베이스에서 노드를 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        node_id: 조회할 노드의 고유 ID.

    Returns:
        조회된 Node 객체 (찾지 못하면 None).
    """
    # Node 모델에서 id를 기준으로 필터링하여 첫 번째 결과 반환
    return db.query(Node).filter(Node.id == node_id).first()

# 스토리에 속한 모든 노드 조회 함수
def get_nodes_by_story_id(db: Session, story_id: int) -> List[Node]:
    """
    스토리에 속한 모든 노드를 데이터베이스에서 조회합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 노드를 조회할 스토리의 ID.

    Returns:
        Node 객체 목록.
    """
    # Node 모델에서 story_id를 기준으로 필터링하여 모든 결과 반환
    return db.query(Node).filter(Node.story_id == story_id).all()

# 노드 일괄 생성 함수 (bulk_create_nodes) - 프론트엔드 요구사항 반영
def bulk_create_nodes(db: Session, story_id: int, nodes_data: List[Dict[str, Any]]) -> List[Node]:
    """
    노드 데이터 목록을 받아 데이터베이스에 일괄 생성합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 생성할 노드들이 속할 스토리의 ID.
        nodes_data: 생성할 노드들의 속성 데이터 목록 (딕셔너리 리스트).

    Returns:
        생성된 Node 객체 목록.
    """
    # Node 모델 인스턴스 목록 생성
    db_nodes = [Node(story_id=story_id, **node_data) for node_data in nodes_data]

    # SQLAlchemy의 bulk_save_objects를 사용하여 효율적인 일괄 삽입
    db.bulk_save_objects(db_nodes)
    db.commit()

    # 일괄 삽입 후에는 객체가 새로고침되지 않으므로, 필요하다면 다시 조회해야 합니다.
    # 여기서는 간단히 삽입된 객체 리스트를 반환하지만, 실제 ID 등이 필요하면 조회 로직 추가
    # 예: 삽입된 노드 ID 목록을 반환하거나, story_id로 다시 조회
    return db_nodes

# 노드 일괄 업데이트 함수 (bulk_update_nodes) - 프론트엔드 요구사항 반영
def bulk_update_nodes(db: Session, story_id: int, nodes_data: List[Dict[str, Any]]) -> List[Node]:
    """
    노드 데이터 목록을 받아 데이터베이스의 기존 노드들을 일괄 업데이트합니다.

    Args:
        db: 데이터베이스 세션 객체.
        story_id: 업데이트할 노드들이 속한 스토리의 ID.
        nodes_data: 업데이트할 노드들의 속성 데이터 목록 (딕셔너리 리스트). 각 딕셔너리는 'id'를 포함해야 합니다.

    Returns:
        업데이트된 Node 객체 목록.
    """
    updated_nodes = []
    # 각 노드 데이터를 순회하며 해당 ID의 노드를 조회하고 속성을 업데이트합니다.
    for node_data in nodes_data:
        node_id = node_data.get("id")
        if node_id is not None:
            # 노드 ID로 노드를 조회하고, 해당 스토리에 속한 노드인지 확인
            db_node = get_node_by_id(db, node_id)
            if db_node and db_node.story_id == story_id:
                 # node_data 딕셔너리의 키/값으로 노드 속성 업데이트
                 for key, value in node_data.items():
                      if key != "id": # id는 업데이트하지 않음
                           setattr(db_node, key, value)
                 updated_nodes.append(db_node) # 업데이트된 노드 리스트에 추가

    db.commit() # 모든 변경 사항 커밋

    # 업데이트된 객체들을 새로고침 (필요 시)
    for node in updated_nodes:
         db.refresh(node)

    return updated_nodes


# 노드 수정 함수 (단일 노드)
# update_data는 딕셔너리 형태로, 수정할 컬럼과 값을 포함합니다.
# bulk_update_nodes 함수가 더 유용할 수 있습니다. 필요에 따라 사용합니다.
def update_node(db: Session, node_id: int, update_data: Dict[str, Any]) -> Optional[Node]:
    """
    노드 ID로 노드 정보를 수정합니다.

    Args:
        db: 데이터베이스 세션 객체.
        node_id: 수정할 노드의 고유 ID.
        update_data: 수정할 컬럼과 값의 딕셔너리.

    Returns:
        수정된 Node 객체 (찾지 못하면 None).
    """
    db_node = get_node_by_id(db, node_id)
    if db_node:
        for key, value in update_data.items():
            setattr(db_node, key, value) # 객체의 속성 업데이트

        db.commit()
        db.refresh(db_node)
        return db_node
    return None # 노드를 찾지 못한 경우


# 노드 삭제 함수
def delete_node(db: Session, node_id: int) -> Optional[Node]:
    """
    노드 ID로 데이터베이스에서 노드를 삭제합니다.

    Args:
        db: 데이터베이스 세션 객체.
        node_id: 삭제할 노드의 고유 ID.

    Returns:
        삭제된 Node 객체 (찾지 못하면 None).
    """
    db_node = get_node_by_id(db, node_id)
    if db_node:
        db.delete(db_node)
        db.commit()
        return db_node
    return None # 노드를 찾지 못한 경우

# TODO: NodeLink 또는 Edge 관련 CRUD 함수 (노드 간 연결 관리를 위한 모델이 있다면 필요)
# 노드 간 연결을 별도의 테이블로 관리한다면 해당 모델에 대한 CRUD 함수를 여기에 추가합니다.
# 예: create_node_link, get_node_links_by_story_id, bulk_update_node_links 등
