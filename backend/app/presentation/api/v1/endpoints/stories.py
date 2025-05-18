# app/presentation/api/v1/endpoints/stories.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core import deps
from app.domain.models.user import User as UserModel

from app.schemas.story_schema import StoryCreate, StoryRead, StoryUpdate
from app.schemas.node_schema import NodeCreate, NodeRead, NodeUpdate
from app.schemas.stat_schema import StatCreate, StatRead, StatUpdate
from app.schemas.prompt_schema import PromptCreate, PromptRead, PromptUpdate
from app.schemas.common import Msg

from app.application.services.story_service import story_service
from app.application.services.node_service import node_service
from app.application.services.stat_service import stat_service
from app.application.services.prompt_service import prompt_service

router = APIRouter()

# --- Story Endpoints ---
@router.post("/", response_model=StoryRead, status_code=status.HTTP_201_CREATED, summary="새로운 스토리 메타데이터 생성")
def create_story_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_in: StoryCreate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    새로운 스토리의 메타데이터(제목, 설명, 초기 스탯, 시스템 프롬프트 등)를 생성합니다.
    이 API는 스토리의 시작 노드를 자동으로 생성하지 않습니다.
    스토리를 시작하려면 별도로 `POST /{story_id}/nodes/` API를 사용하여 `node_type: START`인 노드를 생성해야 합니다.
    """
    return story_service.create_story(db=db, story_in=story_in, current_user=current_user)

@router.get("/", response_model=List[StoryRead], summary="현재 사용자의 스토리 목록 조회")
def read_stories_by_user_endpoint(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    return story_service.get_stories_by_user(db=db, current_user=current_user, skip=skip, limit=limit)

@router.get("/{story_id}", response_model=StoryRead, summary="특정 스토리 조회")
def read_story_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    story = story_service.get_story(db=db, story_id=story_id, current_user=current_user)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="스토리를 찾을 수 없습니다.")
    return story

@router.put("/{story_id}", response_model=StoryRead, summary="특정 스토리 업데이트")
def update_story_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    story_in: StoryUpdate, # StoryUpdate 스키마는 이제 start_node_id를 포함하지 않음
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    주어진 ID를 가진 특정 스토리의 메타데이터를 업데이트합니다.
    스토리의 시작 노드를 변경하려면, 해당 노드를 삭제하고 새로 만들거나,
    별도의 API (예: `PUT /stories/{story_id}/set-start-node/{node_id}`)를 고려할 수 있습니다. (현재 미구현)
    """
    return story_service.update_story(db=db, story_id=story_id, story_in=story_in, current_user=current_user)

@router.delete("/{story_id}", response_model=Msg, summary="특정 스토리 삭제")
def delete_story_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    story_service.delete_story(db=db, story_id=story_id, current_user=current_user)
    return Msg(message="스토리가 성공적으로 삭제되었습니다.")


# --- Node Endpoints (Nested under stories/{story_id}) ---
@router.post("/{story_id}/nodes/", response_model=NodeRead, status_code=status.HTTP_201_CREATED, summary="스토리에 새 노드 생성 (START 노드 포함)")
def create_node_for_story_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    node_in: NodeCreate, # NodeCreate 스키마는 node_type: START 를 받을 수 있음
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    특정 스토리에 새로운 노드를 생성합니다.
    이야기를 시작하려면 이 API를 사용하여 `node_type: START`인 노드를 하나 생성해야 합니다.
    한 스토리에 START 노드는 하나만 존재할 수 있습니다.
    """
    return node_service.create_node(db=db, node_in=node_in, story_id=story_id, current_user=current_user)

# 나머지 Node, Stat, Prompt 엔드포인트는 이전과 거의 동일하게 유지됩니다.
# (이전 stories_py_with_stat_crud_v1 문서 내용 참고)
@router.get("/{story_id}/nodes/", response_model=List[NodeRead], summary="스토리의 모든 노드 조회")
def read_nodes_for_story_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    skip: int = 0,
    limit: int = 1000,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    return node_service.get_nodes_by_story(db=db, story_id=story_id, current_user=current_user, skip=skip, limit=limit)

@router.get("/{story_id}/nodes/{node_id}", response_model=NodeRead, summary="특정 노드 조회")
def read_node_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    node_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    node = node_service.get_node(db=db, node_id=node_id, current_user=current_user)
    if not node or node.story_id != story_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 스토리에서 노드를 찾을 수 없습니다.")
    return node

@router.put("/{story_id}/nodes/{node_id}", response_model=NodeRead, summary="특정 노드 업데이트")
def update_node_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    node_id: int,
    node_in: NodeUpdate,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    updated_node = node_service.update_node(db=db, node_id=node_id, node_in=node_in, current_user=current_user)
    if not updated_node or updated_node.story_id != story_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="잘못된 접근이거나 노드를 찾을 수 없습니다.")
    return updated_node


@router.delete("/{story_id}/nodes/{node_id}", response_model=Msg, summary="특정 노드 삭제")
def delete_node_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    node_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    deleted_node = node_service.delete_node(db=db, node_id=node_id, current_user=current_user)
    if not deleted_node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 노드를 찾을 수 없거나 권한이 없습니다.")
    if deleted_node.story_id != story_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="잘못된 노드 삭제 시도입니다.")
    return Msg(message="노드가 성공적으로 삭제되었습니다.")


# --- Stat Endpoints ---
@router.post("/{story_id}/stats/", response_model=StatRead, status_code=status.HTTP_201_CREATED, summary="스토리에 스탯 설정 추가")
def create_stat_config_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, stat_in: StatCreate, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    return stat_service.create_stat_config(db=db, stat_in=stat_in, story_id=story_id, current_user=current_user)

@router.get("/{story_id}/stats/", response_model=List[StatRead], summary="스토리의 스탯 설정 목록 조회")
def read_stats_for_story_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, skip: int = 0, limit: int = 10, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    return stat_service.get_stats_by_story(db=db, story_id=story_id, current_user=current_user, skip=skip, limit=limit)

@router.get("/{story_id}/stats/{stat_id}", response_model=StatRead, summary="특정 스탯 설정 조회")
def read_stat_config_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, stat_id: int, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    stat = stat_service.get_stat_config(db=db, stat_id=stat_id, current_user=current_user)
    if not stat or stat.story_id != story_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 스토리에서 스탯 설정을 찾을 수 없습니다.")
    return stat

@router.put("/{story_id}/stats/{stat_id}", response_model=StatRead, summary="특정 스탯 설정 업데이트")
def update_stat_config_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, stat_id: int, stat_in: StatUpdate, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    updated_stat = stat_service.update_stat_config(db=db, stat_id=stat_id, stat_in=stat_in, current_user=current_user)
    if not updated_stat or updated_stat.story_id != story_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="업데이트할 스탯 설정을 찾을 수 없거나 권한이 없습니다.")
    return updated_stat

@router.delete("/{story_id}/stats/{stat_id}", response_model=Msg, summary="특정 스탯 설정 삭제")
def delete_stat_config_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, stat_id: int, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    deleted_stat = stat_service.delete_stat_config(db=db, stat_id=stat_id, current_user=current_user)
    if not deleted_stat :
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 스탯 설정을 찾을 수 없거나 권한이 없습니다.")
    if deleted_stat.story_id != story_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="잘못된 접근입니다.")
    return Msg(message="스탯 설정이 성공적으로 삭제되었습니다.")

# --- Prompt Endpoints ---
@router.post("/{story_id}/nodes/{node_id}/prompts/", response_model=PromptRead, status_code=status.HTTP_201_CREATED, summary="노드에 프롬프트 생성")
def create_prompt_for_node_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, node_id: int, prompt_in: PromptCreate, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    return prompt_service.create_prompt(db=db, prompt_in=prompt_in, node_id=node_id, current_user=current_user)

@router.get("/{story_id}/nodes/{node_id}/prompts/", response_model=List[PromptRead], summary="노드의 프롬프트 목록 조회")
def read_prompts_for_node_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, node_id: int, skip: int = 0, limit: int = 100, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    return prompt_service.get_prompts_by_node(db=db, node_id=node_id, current_user=current_user, skip=skip, limit=limit)

@router.get("/{story_id}/nodes/{node_id}/prompts/{prompt_id}", response_model=PromptRead, summary="특정 프롬프트 조회")
def read_prompt_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, node_id: int, prompt_id: int, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    prompt = prompt_service.get_prompt(db=db, prompt_id=prompt_id, current_user=current_user)
    if not prompt or prompt.node_id != node_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 노드에서 프롬프트를 찾을 수 없습니다.")
    return prompt

@router.put("/{story_id}/nodes/{node_id}/prompts/{prompt_id}", response_model=PromptRead, summary="특정 프롬프트 업데이트")
def update_prompt_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, node_id: int, prompt_id: int, prompt_in: PromptUpdate, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    updated_prompt = prompt_service.update_prompt(db=db, prompt_id=prompt_id, prompt_in=prompt_in, current_user=current_user)
    if not updated_prompt or updated_prompt.node_id != node_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="업데이트할 프롬프트를 찾을 수 없거나 권한이 없습니다.")
    return updated_prompt

@router.delete("/{story_id}/nodes/{node_id}/prompts/{prompt_id}", response_model=Msg, summary="특정 프롬프트 삭제")
def delete_prompt_endpoint(*, db: Session = Depends(deps.get_db), story_id: int, node_id: int, prompt_id: int, current_user: UserModel = Depends(deps.get_current_active_user)) -> Any:
    deleted_prompt = prompt_service.delete_prompt(db=db, prompt_id=prompt_id, current_user=current_user)
    if not deleted_prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="삭제할 프롬프트를 찾을 수 없거나 권한이 없습니다.")
    if deleted_prompt.node_id != node_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="잘못된 접근입니다. 요청한 노드 ID와 프롬프트의 실제 노드 ID가 일치하지 않습니다.")
    return Msg(message="프롬프트가 성공적으로 삭제되었습니다.")
