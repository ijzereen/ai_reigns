# app/application/services/prompt_service.py
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.infrastructure.crud.prompt_crud import prompt_crud
from app.infrastructure.crud.node_crud import node_crud # 프롬프트가 속한 노드 검증용
from app.infrastructure.crud.story_crud import story_crud # 간접적 권한 검증용
from app.domain.models.prompt import Prompt
from app.domain.models.user import User # 권한 검사용
from app.schemas.prompt_schema import PromptCreate, PromptUpdate

class PromptService:
    def create_prompt(self, db: Session, *, prompt_in: PromptCreate, node_id: int, current_user: User) -> Prompt:
        node = node_crud.get(db, id=node_id)
        if not node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프롬프트를 추가할 노드를 찾을 수 없습니다.")
        story = story_crud.get(db, id=node.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 노드에 프롬프트를 추가할 권한이 없습니다.")
        prompt_data = prompt_in.model_dump()
        db_obj_prompt = Prompt(**prompt_data, node_id=node_id)
        db.add(db_obj_prompt)
        db.commit()
        db.refresh(db_obj_prompt)
        return db_obj_prompt

    def get_prompt(self, db: Session, prompt_id: int, current_user: User) -> Optional[Prompt]:
        prompt = prompt_crud.get(db, id=prompt_id)
        if not prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프롬프트를 찾을 수 없습니다.")
        if prompt.node_id:
            node = node_crud.get(db, id=prompt.node_id)
            if not node:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프롬프트가 연결된 노드를 찾을 수 없습니다.")
            story = story_crud.get(db, id=node.story_id)
            if not story or story.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 프롬프트에 접근할 권한이 없습니다.")
        return prompt

    def get_prompts_by_node(self, db: Session, node_id: int, current_user: User, skip: int = 0, limit: int = 100) -> List[Prompt]:
        node = node_crud.get(db, id=node_id)
        if not node:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="노드를 찾을 수 없습니다.")
        story = story_crud.get(db, id=node.story_id)
        if not story or story.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 노드의 프롬프트에 접근할 권한이 없습니다.")
        return prompt_crud.get_multi_by_node(db, node_id=node_id, skip=skip, limit=limit)

    def update_prompt(self, db: Session, *, prompt_id: int, prompt_in: PromptUpdate, current_user: User) -> Optional[Prompt]:
        db_prompt = prompt_crud.get(db, id=prompt_id)
        if not db_prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="업데이트할 프롬프트를 찾을 수 없습니다.")
        if db_prompt.node_id:
            node = node_crud.get(db, id=db_prompt.node_id)
            if not node:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프롬프트가 연결된 노드를 찾을 수 없습니다.")
            story = story_crud.get(db, id=node.story_id)
            if not story or story.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 프롬프트를 수정할 권한이 없습니다.")
        return prompt_crud.update(db, db_obj=db_prompt, obj_in=prompt_in)

    def delete_prompt(self, db: Session, prompt_id: int, current_user: User) -> Optional[Prompt]:
        db_prompt = prompt_crud.get(db, id=prompt_id)
        if not db_prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 프롬프트를 찾을 수 없습니다.")
        if db_prompt.node_id:
            node = node_crud.get(db, id=db_prompt.node_id)
            if not node:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프롬프트가 연결된 노드를 찾을 수 없습니다.")
            story = story_crud.get(db, id=node.story_id)
            if not story or story.user_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 프롬프트를 삭제할 권한이 없습니다.")
        return prompt_crud.remove(db, id=prompt_id)

prompt_service = PromptService()