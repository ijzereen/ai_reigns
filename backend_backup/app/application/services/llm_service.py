# app/application/services/llm_service.py
# LLM(Large Language Model) 연동 및 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.

from sqlalchemy.orm import Session
from typing import Dict, Any, List

# TODO: 필요한 도메인 모델 임포트
# from app.domain.models.story import Story
# from app.domain.models.node import Node
# from app.domain.models.prompt import Prompt

# TODO: Infrastructure 계층의 LLM 클라이언트 임포트
# from app.infrastructure.llm.llm_client import LLMClient

class LLMService:
    """
    LLM 연동 및 관련 비즈니스 로직을 제공하는 서비스 클래스.
    Infrastructure 계층의 LLM 클라이언트를 사용하여 LLM과 상호작용합니다.
    """

    def __init__(self):
        # TODO: LLM 클라이언트 인스턴스 생성 또는 주입
        # self.llm_client = LLMClient()
        pass

    # TODO: LLM을 사용하여 스토리 노드를 생성하는 메서드
    # def generate_story_nodes(
    #     self,
    #     story: Story,
    #     source_node: Node,
    #     options: Dict[str, Any] # 예: { "depth": 2, "node_type": "story", "prompt": "다음 내용은 왕국이 번영하는 이야기" }
    # ) -> Dict[str, List[Dict[str, Any]]]:
    #     """
    #     LLM을 사용하여 특정 노드 이후의 스토리 노드들을 생성합니다.
    #     """
    #     # 1. 비즈니스 로직: LLM 프롬프트 구성 (story, source_node, options 활용)
    #     # prompt_text = self._build_generation_prompt(story, source_node, options)
    #
    #     # 2. Infrastructure 계층 호출: LLM 클라이언트를 사용하여 LLM 호출
    #     # raw_llm_response = self.llm_client.call_llm(prompt_text)
    #
    #     # 3. 비즈니스 로직: LLM 응답 파싱 및 가공 (생성된 노드/엣지 데이터 추출)
    #     # generated_data = self._parse_llm_response(raw_llm_response, options)
    #
    #     # 4. 비즈니스 로직: 생성된 데이터 유효성 검사 등
    #     # self._validate_generated_data(generated_data)
    #
    #     # 5. 생성된 데이터 반환 (저장은 StoryService에서 담당)
    #     # return generated_data # 예: {"new_nodes_data": [...], "new_edges_data": [...]}
    #     pass # TODO: 실제 로직 구현

    # TODO: LLM을 사용하여 주관식 답변 기반 라우팅을 결정하는 메서드
    # def determine_routing_from_answer(
    #     self,
    #     question_node: Node,
    #     user_answer: str,
    #     routing_prompt: Prompt # 라우팅 조건 프롬프트
    # ) -> Optional[int]: # 다음 노드 ID 반환
    #     """
    #     사용자의 주관식 답변과 라우팅 조건 프롬프트를 바탕으로 다음 노드 ID를 결정합니다.
    #     """
    #     pass # TODO: 실제 로직 구현

    # TODO: LLM을 사용하여 스탯 변동을 결정하는 메서드
    # def determine_stat_changes(
    #     self,
    #     story: Story,
    #     current_stats: Dict[str, int],
    #     choice_context: Dict[str, Any], # 어떤 선택/답변이었는지 정보
    #     adjustment_prompt: Prompt # 스탯 조정 프롬프트
    # ) -> Dict[str, int]: # 변경될 스탯 값 반환
    #     """
    #     현재 스탯, 사용자 선택/답변, 스탯 조정 프롬프트를 바탕으로 스탯 변동을 결정합니다.
    #     """
    #     pass # TODO: 실제 로직 구현

    # TODO: 내부 헬퍼 메서드들 (_build_generation_prompt, _parse_llm_response 등)
    # ...
