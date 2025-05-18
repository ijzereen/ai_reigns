# app/application/services/node_service.py
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.infrastructure.crud.node_crud import node_crud
from app.infrastructure.crud.story_crud import story_crud
from app.domain.models.node import Node, NodeType as ModelNodeType # SQLAlchemy 모델의 NodeType
from app.domain.models.user import User
from app.schemas.node_schema import NodeCreate, NodeUpdate, NodeType as SchemaNodeType # Pydantic 스키마의 NodeType

class NodeService:
    def create_node(self, db: Session, *, node_in: NodeCreate, story_id: int, current_user: User) -> Node:
        """새로운 노드를 생성합니다."""
        story = story_crud.get(db, id=story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="노드를 추가할 스토리를 찾을 수 없습니다.")
        if story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스토리에 노드를 추가할 권한이 없습니다.")

        # 만약 생성하려는 노드가 START 타입이라면, 해당 스토리에 이미 START 노드가 있는지 확인
        if node_in.node_type == SchemaNodeType.START: # Pydantic 스키마의 NodeType 사용
            existing_start_node = db.query(Node).filter(Node.story_id == story_id, Node.node_type == ModelNodeType.START).first() # SQLAlchemy 모델의 NodeType 사용
            if existing_start_node:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"스토리 ID {story_id}에 이미 시작(START) 노드가 존재합니다 (노드 ID: {existing_start_node.id}). 시작 노드는 하나만 생성할 수 있습니다."
                )
        
        # Pydantic 스키마에서 받은 데이터를 딕셔너리로 변환
        node_data_dict = node_in.model_dump()
        
        # Pydantic 스키마의 NodeType 문자열 값을 SQLAlchemy 모델의 NodeType Enum 멤버로 변환
        model_enum_node_type = ModelNodeType[node_in.node_type.value]
        
        # Node 모델 객체 생성 시 사용할 데이터 준비
        # node_data_dict에서 'node_type' 키를 제거하여 중복 전달 방지
        if 'node_type' in node_data_dict:
            del node_data_dict['node_type']
            
        db_obj_node = Node(
            **node_data_dict,          # title, text_content, choices 등 Pydantic 스키마의 다른 필드들
            story_id=story_id,
            node_type=model_enum_node_type # 변환된 SQLAlchemy Enum 멤버 사용
        )
        
        db.add(db_obj_node)
        db.commit()
        db.refresh(db_obj_node)
        return db_obj_node

    def get_node(self, db: Session, node_id: int, current_user: User) -> Node:
        node = node_crud.get(db, id=node_id)
        if not node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="노드를 찾을 수 없습니다.")
        
        story = story_crud.get(db, id=node.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 노드에 접근할 권한이 없습니다.")
        return node

    def get_nodes_by_story(self, db: Session, story_id: int, current_user: User, skip: int = 0, limit: int = 1000) -> List[Node]:
        story = story_crud.get(db, id=story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="스토리를 찾을 수 없습니다.")
        if story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스토리의 노드에 접근할 권한이 없습니다.")
        return node_crud.get_multi_by_story(db, story_id=story_id, skip=skip, limit=limit)

    def update_node(self, db: Session, *, node_id: int, node_in: NodeUpdate, current_user: User) -> Node:
        db_node = node_crud.get(db, id=node_id)
        if not db_node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="업데이트할 노드를 찾을 수 없습니다.")

        story = story_crud.get(db, id=db_node.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 노드를 수정할 권한이 없습니다.")
        
        update_data = node_in.model_dump(exclude_unset=True)
        
        # node_type 필드가 업데이트 요청에 포함되어 있고, 실제 DB 값과 다른 경우 처리
        if 'node_type' in update_data and update_data['node_type'] is not None:
            requested_schema_node_type = update_data['node_type'] # SchemaNodeType
            # SchemaNodeType을 ModelNodeType으로 변환
            model_enum_to_update = ModelNodeType[requested_schema_node_type.value]

            if db_node.node_type == ModelNodeType.START and model_enum_to_update != ModelNodeType.START:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="시작(START) 노드의 타입은 변경할 수 없습니다.")
            
            if model_enum_to_update == ModelNodeType.START and db_node.node_type != ModelNodeType.START:
                existing_start_node = db.query(Node).filter(Node.story_id == db_node.story_id, Node.node_type == ModelNodeType.START, Node.id != db_node.id).first()
                if existing_start_node:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"스토리 ID {db_node.story_id}에 이미 다른 시작(START) 노드가 존재합니다. 시작 노드는 하나만 존재해야 합니다.")
            
            update_data['node_type'] = model_enum_to_update # 변환된 ModelNodeType으로 설정
        
        return node_crud.update(db, db_obj=db_node, obj_in=update_data)

    def delete_node(self, db: Session, node_id: int, current_user: User) -> Node:
        db_node = node_crud.get(db, id=node_id)
        if not db_node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 노드를 찾을 수 없습니다.")

        story = story_crud.get(db, id=db_node.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 노드를 삭제할 권한이 없습니다.")

        if db_node.node_type == ModelNodeType.START:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="시작(START) 노드는 삭제할 수 없습니다. 다른 노드를 시작 노드로 지정한 후 시도해주세요.")
            
        return node_crud.remove(db, id=node_id)

node_service = NodeService()
