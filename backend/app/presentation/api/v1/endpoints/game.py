# app/presentation/api/v1/endpoints/game.py
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import deps
from app.domain.models.user import User as UserModel
# from app.domain.models.node import Node as NodeModel
from app.application.services.game_service import game_service
# from app.schemas.node_schema import NodeRead # game_service에서 이미 NodeRead로 변환하여 반환

router = APIRouter()

class GameProgressPayload(BaseModel): 
    current_node_id: int
    current_stats: dict
    choice_index: Optional[int] = None
    user_input: Optional[str] = None

@router.post("/{story_id}/start", response_model=Any, summary="게임 시작 (START 노드 사용)")
def start_game_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    story_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    특정 스토리 ID로 게임을 시작합니다.
    해당 스토리 내에 `node_type: START`인 노드를 찾아 게임을 시작하며,
    첫 번째 노드 정보와 초기 스탯을 반환합니다.
    START 노드가 없으면 오류가 발생합니다.
    """
    game_state = game_service.start_game(db=db, story_id=story_id, current_user=current_user)
    return game_state

@router.post("/progress", response_model=Any, summary="게임 진행")
def progress_game_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    payload: GameProgressPayload = Body(...),
    current_user: UserModel = Depends(deps.get_current_active_user),
) -> Any:
    """
    사용자의 선택 또는 입력을 받아 게임을 다음 단계로 진행합니다.
    다음 노드 정보와 변경된 스탯을 반환합니다.
    """
    game_state = game_service.progress_game(
        db=db,
        current_node_id=payload.current_node_id,
        choice_index=payload.choice_index,
        user_input=payload.user_input,
        current_stats=payload.current_stats,
        current_user=current_user
    )
    return game_state
