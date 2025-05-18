# app/application/services/game_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import json
from typing import Optional, List, Dict, Any

from app.domain.models.story import Story
from app.domain.models.node import Node, NodeType # 모델의 NodeType 임포트
from app.domain.models.user import User
from app.infrastructure.crud.story_crud import story_crud
from app.infrastructure.crud.node_crud import node_crud
from app.schemas.node_schema import NodeRead # 스키마의 NodeType은 여기서 직접 사용 안 함

class GameService:
    def start_game(self, db: Session, story_id: int, current_user: User) -> dict:
        """게임을 시작하고 첫 번째 노드(START 타입)와 초기 스탯을 반환합니다."""
        story = story_crud.get(db, id=story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="시작할 스토리를 찾을 수 없습니다.")
        # 권한 검사 (선택 사항)
        # if story.user_id != current_user.id:
        #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 스토리를 플레이할 권한이 없습니다.")

        # 해당 스토리의 START 노드를 찾습니다.
        start_node_obj = db.query(Node).filter(Node.story_id == story_id, Node.node_type == NodeType.START).first() # 모델의 NodeType.START 사용

        if not start_node_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"스토리 ID {story_id}에 시작(START) 노드가 설정되어 있지 않습니다. 먼저 시작 노드를 생성해주세요.")
        
        current_node_read = NodeRead.model_validate(start_node_obj) # Pydantic V2

        initial_stats = {}
        if isinstance(story.initial_stats, str):
            try:
                initial_stats = json.loads(story.initial_stats)
            except json.JSONDecodeError:
                initial_stats = {}
        elif isinstance(story.initial_stats, dict):
             initial_stats = story.initial_stats
        
        return {
            "current_node": current_node_read,
            "current_stats": initial_stats,
            "story_title": story.title
        }

    def progress_game(self, db: Session, current_node_id: int, choice_index: Optional[int], user_input: Optional[str], current_stats: dict, current_user: User) -> dict:
        current_node_obj = node_crud.get(db, id=current_node_id)
        if not current_node_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="현재 노드를 찾을 수 없습니다.")

        story = story_crud.get(db, id=current_node_obj.story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="현재 스토리를 찾을 수 없습니다.")
        # 권한 검사 (선택 사항)
        # if story.user_id != current_user.id:
        #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 게임을 진행할 권한이 없습니다.")

        next_node_id_val: Optional[int] = None
        updated_stats = current_stats.copy()

        # START 또는 STORY 노드 처리: choices에 단일 다음 노드가 정의되어 있으면 그곳으로 이동
        if current_node_obj.node_type == NodeType.START or current_node_obj.node_type == NodeType.STORY:
            if current_node_obj.choices and isinstance(current_node_obj.choices, list) and len(current_node_obj.choices) > 0:
                # 첫 번째 choice를 다음 경로로 간주 (START/STORY 노드는 보통 단일 경로)
                first_choice = current_node_obj.choices[0]
                if "stat_effects" in first_choice and isinstance(first_choice["stat_effects"], dict):
                    for stat_name, change in first_choice["stat_effects"].items():
                        updated_stats[stat_name] = updated_stats.get(stat_name, 0) + change
                next_node_id_val = first_choice.get("next_node_id")
            else: # 다음 노드 정보가 없으면 이야기의 끝으로 간주
                 current_node_read = NodeRead.model_validate(current_node_obj)
                 return {"message": "이야기의 끝입니다.", "current_node": current_node_read, "current_stats": updated_stats, "story_title": story.title}

        elif current_node_obj.node_type == NodeType.QUESTION:
            if not current_node_obj.choices or not isinstance(current_node_obj.choices, list) or not current_node_obj.choices: # 선택지가 비어있는 경우도 처리
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="질문 노드에 선택지가 올바르게 설정되지 않았습니다.")

            if choice_index is not None and 0 <= choice_index < len(current_node_obj.choices):
                selected_choice = current_node_obj.choices[choice_index]
                next_node_id_val = selected_choice.get("next_node_id")
                if "stat_effects" in selected_choice and isinstance(selected_choice["stat_effects"], dict):
                    for stat_name, change in selected_choice["stat_effects"].items():
                        updated_stats[stat_name] = updated_stats.get(stat_name, 0) + change
            elif user_input is not None: # 주관식 답변 (LLM 연동 필요)
                current_node_read = NodeRead.model_validate(current_node_obj)
                return {"message": "답변을 받았습니다. LLM이 다음 이야기를 준비 중입니다... (주관식 처리 구현 필요)", "current_node": current_node_read, "current_stats": updated_stats, "needs_llm_processing": True, "story_title": story.title}
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="선택지 인덱스 또는 사용자 입력이 필요합니다.")

        elif current_node_obj.node_type == NodeType.AI_STORY: # AI 스토리 노드 처리 (LLM 연동 필요)
            current_node_read = NodeRead.model_validate(current_node_obj)
            return {"message": "AI 생성 이야기입니다. 다음 진행을 위해 LLM 처리가 필요합니다... (AI_STORY 처리 구현 필요)", "current_node": current_node_read, "current_stats": updated_stats, "needs_llm_processing": True, "story_title": story.title}

        if next_node_id_val is not None:
            next_node_obj = node_crud.get(db, id=next_node_id_val)
            if not next_node_obj:
                 current_node_read = NodeRead.model_validate(current_node_obj)
                 return {"message": f"다음 노드(ID: {next_node_id_val})를 찾을 수 없어 게임을 계속할 수 없습니다.", "current_node": current_node_read, "current_stats": updated_stats, "story_title": story.title}
            
            next_node_read = NodeRead.model_validate(next_node_obj)
            return {
                "current_node": next_node_read,
                "current_stats": updated_stats,
                "story_title": story.title
            }
        else: 
            current_node_read = NodeRead.model_validate(current_node_obj)
            # NodeType.START/STORY에서 choices가 있지만 next_node_id가 없는 경우도 이야기의 끝으로 간주
            if current_node_obj.node_type == NodeType.START or current_node_obj.node_type == NodeType.STORY:
                 return {"message": "이야기의 끝에 도달했습니다.", "current_node": current_node_read, "current_stats": updated_stats, "story_title": story.title}
            return {"message": "다음 진행 경로가 명확하지 않습니다.", "current_node": current_node_read, "current_stats": updated_stats, "story_title": story.title}

game_service = GameService()
