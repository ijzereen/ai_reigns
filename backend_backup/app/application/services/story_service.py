# app/application/services/story_service.py
# 스토리(Story), 노드(Node), 엣지(분기) 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Dict, Any, Optional

from app.domain.models.story import Story # Story 도메인 모델 임포트
from app.domain.models.node import Node, NodeType # Node 도메인 모델 및 Enum 임포트
from app.domain.models.stat import Stat # Stat 도메인 모델 임포트
from app.domain.models.prompt import Prompt # Prompt 도메인 모델 임포트
# TODO: NodeLink 또는 Edge 도메인 모델이 필요하다면 임포트합니다.

# Infrastructure 계층의 CRUD 함수 임포트 (아직 모두 구현되지 않았을 수 있습니다)
from app.infrastructure.crud.story_crud import (
    create_story as crud_create_story,
    get_story_by_id as crud_get_story_by_id,
    get_stories as crud_get_stories,
    update_story as crud_update_story,
    delete_story as crud_delete_story,
)
from app.infrastructure.crud.node_crud import (
    create_node as crud_create_node,
    get_node_by_id as crud_get_node_by_id,
    get_nodes_by_story_id as crud_get_nodes_by_story_id,
    update_node as crud_update_node,
    delete_node as crud_delete_node,
    bulk_create_nodes as crud_bulk_create_nodes, # 일괄 생성 CRUD 함수 필요
    bulk_update_nodes as crud_bulk_update_nodes, # 일괄 업데이트 CRUD 함수 필요
)
from app.infrastructure.crud.stat_crud import (
    create_stat as crud_create_stat,
    get_stats_by_story_id as crud_get_stats_by_story_id,
    # ... 기타 스탯 CRUD 함수
)
from app.infrastructure.crud.prompt_crud import (
    create_prompt as crud_create_prompt,
    get_prompts_by_story_id as crud_get_prompts_by_story_id,
    # ... 기타 프롬프트 CRUD 함수
)
# TODO: 엣지(분기 연결) 관련 CRUD 함수 임포트 (NodeLink_crud 등)

# TODO: LLM 서비스 임포트 (나중에 구현)
# from app.application.services.llm_service import LLMService

class StoryService:
    """
    스토리, 노드, 엣지 관련 비즈니스 로직을 제공하는 서비스 클래스.
    Infrastructure 계층의 CRUD 함수를 사용하여 데이터를 조작하고,
    LLM 서비스와 연동하여 AI 관련 기능을 수행합니다.
    """

    def __init__(self):
        # 필요한 경우 다른 서비스나 인프라 객체를 주입받을 수 있습니다.
        # 예: self.llm_service = LLMService()
        pass

    def create_story(
        self,
        db: Session,
        title: str,
        description: Optional[str],
        creator_id: int,
        initial_stats_data: List[Dict[str, Any]], # 예: [{"name": "용기", "initial_value": 10}]
        initial_system_prompt: Optional[str] = None,
    ) -> Story:
        """
        새로운 스토리를 생성하고 초기 스탯 및 시스템 프롬프트를 설정합니다.

        Args:
            db: 데이터베이스 세션.
            title: 스토리 제목.
            description: 스토리 설명.
            creator_id: 제작자 사용자 ID.
            initial_stats_data: 초기 스탯 데이터 목록.
            initial_system_prompt: 초기 시스템 프롬프트.

        Returns:
            생성된 Story 도메인 모델 객체.
        """
        # 1. Infrastructure 계층 호출: 스토리 생성
        story = crud_create_story(
            db=db,
            title=title,
            description=description,
            creator_id=creator_id,
            initial_stats=initial_stats_data, # JSON 또는 다른 형태로 저장되도록 CRUD 함수에서 처리 필요
            initial_system_prompt=initial_system_prompt
        )

        # 2. 비즈니스 로직: 초기 스탯 생성 (Story 생성 후 Story ID를 사용하여 Stat 생성)
        # TODO: initial_stats_data를 기반으로 Stat 모델 인스턴스를 생성하고 CRUD 함수로 저장
        for stat_data in initial_stats_data:
             crud_create_stat(db=db, story_id=story.id, name=stat_data["name"], initial_value=stat_data.get("initial_value", 0))

        # TODO: 시작 노드 생성 로직 추가 (스토리 생성 시 빈 시작 노드를 만들 수 있습니다)
        # start_node = crud_create_node(...)
        # story.start_node_id = start_node.id
        # crud_update_story(db=db, story_id=story.id, update_data={"start_node_id": start_node.id})


        db.refresh(story) # 스탯 등 관계 데이터가 로드되도록 새로고침
        return story

    def get_story_by_id(self, db: Session, story_id: int) -> Story:
        """
        스토리 ID로 스토리를 조회합니다. 없으면 예외 발생.
        """
        story = crud_get_story_by_id(db, story_id)
        if not story:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
        return story

    def get_stories_by_creator(self, db: Session, creator_id: int) -> List[Story]:
        """
        제작자 ID로 스토리 목록을 조회합니다.
        """
        # TODO: crud_get_stories 함수에 creator_id 필터링 기능 추가 필요
        return crud_get_stories(db, creator_id=creator_id)


    def get_nodes_by_story_id(self, db: Session, story_id: int) -> List[Node]:
        """
        스토리에 속한 모든 노드를 조회합니다.
        """
        # Infrastructure 계층 호출: 노드 목록 조회
        return crud_get_nodes_by_story_id(db, story_id)

    def get_edges_by_story_id(self, db: Session, story_id: int) -> List[Dict[str, Any]]:
        """
        스토리에 속한 모든 엣지(분기 연결) 데이터를 조회합니다.
        엣지 데이터는 노드 정보에 포함되거나 별도의 모델로 관리될 수 있습니다.
        여기서는 노드 정보를 기반으로 엣지 형태의 데이터를 구성하여 반환한다고 가정합니다.
        """
        # TODO: 노드 정보 또는 별도의 엣지 모델을 사용하여 엣지 데이터 구성 및 반환 로직 구현
        # 예: 각 노드의 '이어질 노드 ID 목록' 정보를 기반으로 엣지 리스트 생성
        nodes = self.get_nodes_by_story_id(db, story_id)
        edges_data = []
        # for node in nodes:
        #     # TODO: 노드 데이터에서 엣지 정보 추출 및 edges_data 리스트에 추가
        #     # 예: node.child_node_ids (콤마 구분 문자열) 파싱 또는 NodeLink 모델 조회
        #     pass
        return edges_data # 구성된 엣지 데이터 반환

    def bulk_update_story_elements(
        self,
        db: Session,
        story_id: int,
        nodes_data: List[Dict[str, Any]], # 프론트엔드에서 받은 노드 데이터 목록
        edges_data: List[Dict[str, Any]], # 프론트엔드에서 받은 엣지 데이터 목록
        # TODO: 삭제된 노드/엣지 ID 목록도 받을 수 있습니다.
    ):
        """
        스토리에 속한 노드와 엣지 데이터를 일괄 업데이트합니다.
        스토리 에디터에서 저장 시 사용될 수 있습니다.
        """
        # 1. 비즈니스 로직: 유효성 검사 (예: 노드 연결 규칙 위반 여부, 데이터 형식 등)
        # TODO: 노드 타입별 최대 엣지 수 제한, 사이클 생성 방지 등의 로직 검사 구현
        # if not self._validate_story_structure(nodes_data, edges_data):
        #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid story structure")

        # 2. Infrastructure 계층 호출: 노드 일괄 업데이트/생성/삭제
        # TODO: nodes_data를 기반으로 기존 노드는 업데이트, 새 노드는 생성, 목록에 없는 노드는 삭제 처리
        crud_bulk_update_nodes(db, story_id, nodes_data) # 예시 함수 호출

        # 3. Infrastructure 계층 호출: 엣지 일괄 업데이트/생성/삭제
        # TODO: edges_data를 기반으로 엣지 데이터(NodeLink 또는 Node 속성) 업데이트/생성/삭제 처리
        # 엣지 데이터에 포함된 스탯 변화, LLM 라우팅 조건 등도 함께 저장/업데이트
        # crud_bulk_update_edges(db, story_id, edges_data) # 예시 함수 호출

        db.commit() # 모든 변경 사항 커밋 (트랜잭션 관리)


    def _validate_story_structure(self, nodes_data: List[Dict[str, Any]], edges_data: List[Dict[str, Any]]) -> bool:
        """
        (내부 메서드) 스토리 구조의 유효성을 검사합니다.
        노드 타입별 연결 규칙, 사이클 등을 확인합니다.
        """
        # TODO: 유효성 검사 로직 구현
        # 예: 노드 ID 유효성, 엣지 연결 유효성, 사이클 감지 알고리즘 등
        return True # 임시로 항상 True 반환

    def generate_ai_nodes(
        self,
        db: Session,
        story_id: int,
        source_node_id: int,
        generation_options: Dict[str, Any], # 예: { "depth": 2, "node_type": "story", "prompt": "다음 내용은 왕국이 번영하는 이야기" }
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        LLM을 사용하여 특정 노드 이후의 스토리 노드들을 생성합니다.
        """
        # 1. 비즈니스 로직: 입력 유효성 검사 및 필요한 정보 조회
        source_node = crud_get_node_by_id(db, source_node_id)
        if not source_node or source_node.story_id != story_id:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source node not found in story")

        story = crud_get_story_by_id(db, story_id)
        if not story:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

        # 2. Application 계층 호출: LLM 서비스 호출 (AI 생성 로직 위임)
        # TODO: LLMService 인스턴스를 주입받거나 생성하여 호출
        # llm_service = LLMService() # 예시
        # generated_data = llm_service.generate_story_nodes(
        #     story=story,
        #     source_node=source_node,
        #     options=generation_options
        # )
        # 생성된 데이터는 노드 및 엣지 형태일 것입니다.
        generated_data = { # 임시 더미 데이터
            "new_nodes_data": [{"id": -1, "node_type": "story", "text": "AI 생성 스토리 예시", "position_x": 0, "position_y": 0}],
            "new_edges_data": [{"id": -1, "source_node_id": source_node_id, "target_node_id": -1, "label": "AI 생성 경로"}]
        }


        # 3. Infrastructure 계층 호출: 생성된 노드 및 엣지 데이터를 데이터베이스에 저장
        # TODO: generated_data를 기반으로 실제 Node 및 NodeLink/Edge 모델 인스턴스 생성 및 저장
        created_nodes = crud_bulk_create_nodes(db, story_id, generated_data["new_nodes_data"]) # 예시 함수 호출
        # created_edges = crud_bulk_create_edges(db, story_id, generated_data["new_edges_data"]) # 예시 함수 호출

        db.commit() # 변경 사항 커밋

        # 4. 비즈니스 로직: 생성된 노드/엣지 정보 반환 (프론트엔드 스키마 형태로 변환 필요)
        # TODO: 생성된 DB 모델 객체를 프론트엔드에서 요구하는 스키마 형태로 변환하여 반환
        return {
            "new_nodes": created_nodes, # 실제로는 스키마 형태로 변환 필요
            "new_edges": generated_data["new_edges_data"] # 실제로는 DB 저장 후 조회 또는 스키마 형태로 변환 필요
        }

    # TODO: 게임 플레이 관련 비즈니스 로직 메서드 추가 (GameService로 분리될 수도 있습니다)
    # - start_game(story_id, user_id) -> 초기 게임 상태 반환 (현재 노드, 스탯 등)
    # - process_player_choice(game_session_id, current_node_id, choice_data) -> 다음 노드 및 스탯 변화 반환
    # ...

# 참고: FastAPI의 의존성 주입 시스템에 StoryService 인스턴스를 제공하기 위해
# app/core/deps.py 파일에 다음과 같은 헬퍼 함수를 추가할 수 있습니다.
#
# # app/core/deps.py (추가 내용)
# from sqlalchemy.orm import Session
# from fastapi import Depends
# from . import services # services 디렉토리를 패키지로 임포트
# from .deps import get_db # get_db 함수 임포트
#
# # StoryService 인스턴스를 제공하는 의존성 함수
# def get_story_service(db: Session = Depends(get_db)) -> services.story_service.StoryService:
#     """
#     StoryService 인스턴스를 제공하는 의존성 함수.
#     """
#     return services.story_service.StoryService()
