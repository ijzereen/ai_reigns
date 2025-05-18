# app/application/services/llm_service.py
from sqlalchemy.orm import Session # Session 임포트 추가
from typing import Optional, Any, Dict, List # Optional 및 다른 필요 타입 임포트

# from langchain_openai import ChatOpenAI # 예시
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# from app.core.config import settings # API 키 등 설정 로드
from app.domain.models.node import Node # Node 모델 임포트 (필요시)
# from app.domain.models.prompt import PromptType # PromptType 임포트 (필요시)
# from app.schemas.node_schema import NodeCreate # LLM이 생성한 노드 데이터용 (필요시)
# from app.infrastructure.crud.prompt_crud import prompt_crud # prompt_crud 임포트 (필요시)


class LLMService:
    def __init__(self):
        # self.llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model_name="gpt-3.5-turbo") # 예시
        # self.parser = StrOutputParser()
        # 초기화 코드가 있다면 여기에 작성합니다.
        pass

    def generate_story_node_text(self, db_session: Session, system_prompt: Optional[str], user_prompt: str) -> str:
        """LLM을 사용하여 새로운 스토리 노드의 텍스트를 생성합니다."""
        # full_prompt_text = f"{system_prompt}\n\n{user_prompt}" if system_prompt else user_prompt
        # prompt_template = ChatPromptTemplate.from_template(full_prompt_text)
        # chain = prompt_template | self.llm | self.parser
        # response = chain.invoke({}) # type: ignore
        # return response
        print(f"LLM 요청 (generate_story_node_text): system_prompt='{system_prompt}', user_prompt='{user_prompt}'")
        return f"LLM 응답: '{user_prompt}'에 대한 이야기입니다. (LLM 연동 구현 필요)" # 임시 반환

    def route_based_on_input(self, db_session: Session, current_node: Node, user_input: str, current_stats: Dict[str, Any]) -> Optional[int]:
        """
        사용자의 주관식 답변(user_input)과 현재 노드의 라우팅 조건(프롬프트)을 기반으로
        LLM을 사용하여 다음 노드 ID를 결정합니다.
        """
        # 1. current_node와 연관된 ROUTING 타입의 프롬프트를 찾습니다.
        #    (예: prompt_crud.get_prompts_by_node_and_type(db_session, node_id=current_node.id, prompt_type=PromptType.ROUTING))
        # 2. 해당 프롬프트와 user_input, current_stats를 조합하여 LLM에 전달할 최종 프롬프트를 구성합니다.
        # 3. LLM으로부터 다음 노드 ID 또는 특정 키워드를 응답으로 받습니다.
        # 4. 응답을 파싱하여 실제 다음 노드 ID를 반환합니다.
        
        # routing_prompts = prompt_crud.get_multi_by_node(db_session, node_id=current_node.id) # 모든 프롬프트 가져오기
        # routing_prompt_text = None
        # for p in routing_prompts:
        #     if p.prompt_type == PromptType.ROUTING: # PromptType enum 임포트 필요
        #         routing_prompt_text = p.prompt_text
        #         break
        #
        # if not routing_prompt_text:
        #     print(f"라우팅 프롬프트 없음: 노드 ID {current_node.id}")
        #     return None # 라우팅 프롬프트가 없으면 결정 불가

        # llm_input_for_routing = f"{routing_prompt_text}\n\n사용자 답변: {user_input}\n현재 스탯: {current_stats}"
        # print(f"LLM 요청 (route_based_on_input): {llm_input_for_routing}")
        # ... LLM 호출 ...
        # next_node_id = ... (LLM 응답에서 파싱)
        # return next_node_id
        print(f"LLM 라우팅 시도: 노드 ID {current_node.id}, 입력 '{user_input}', 스탯 {current_stats} (LLM 연동 구현 필요)")
        return None # 임시 반환: 다음 노드를 결정할 수 없음

    def dynamically_create_ai_node(self, db_session: Session, story_id: int, user_input: str, system_prompt: Optional[str], current_stats: Dict[str, Any]) -> Optional[Node]:
        """사용자 입력과 현재 상황을 바탕으로 LLM이 새로운 AI 스토리 노드를 동적으로 생성하고 DB에 저장 후 반환합니다."""
        # 1. user_input, system_prompt, current_stats 등을 조합하여 LLM에게 새로운 스토리 생성을 요청하는 프롬프트를 만듭니다.
        # 2. LLM으로부터 새로운 노드의 제목, 내용, 가능한 선택지 등을 응답으로 받습니다.
        # 3. 응답을 파싱하여 NodeCreate 스키마 객체를 만듭니다.
        # 4. node_service (또는 직접 node_crud)를 사용하여 새 노드를 DB에 저장합니다.
        
        # llm_prompt_for_creation = f"{system_prompt}\n\n플레이어의 최근 행동/입력: {user_input}\n현재 상황(스탯): {current_stats}\n\n이 상황에 이어질 다음 이야기를 흥미진진하게 만들어주세요. 이야기의 [제목]과 [내용]을 명확히 구분해서 작성해주세요. (예: [제목] 마법의 숲 / [내용] 플레이어는 신비로운 빛을 따라 마법의 숲으로 들어섰다...)"
        # generated_full_content = self.generate_story_node_text(db_session, None, llm_prompt_for_creation)
        
        # # LLM 응답 파싱 (예시: 제목과 내용이 '[제목]'과 '[내용]' 태그로 구분된다고 가정)
        # title = "AI 생성 노드"
        # text_content = generated_full_content
        # try:
        #     title_start = generated_full_content.index("[제목]") + len("[제목]")
        #     title_end = generated_full_content.index("[내용]")
        #     title = generated_full_content[title_start:title_end].strip()
        #     text_content_start = generated_full_content.index("[내용]") + len("[내용]")
        #     text_content = generated_full_content[text_content_start:].strip()
        # except ValueError:
        #     print("LLM 응답 파싱 실패: [제목] 또는 [내용] 태그를 찾을 수 없습니다.")
        #     # 파싱 실패 시, 전체 내용을 text_content로 사용하거나 오류 처리

        # from app.schemas.node_schema import NodeCreate, NodeType # 함수 내에서 임포트 (순환참조 방지용)
        # from app.application.services.node_service import node_service # 함수 내에서 임포트 (순환참조 방지용)
        # from app.domain.models.user import User # 임시 current_user용 (실제로는 인증된 사용자 사용)

        # new_node_data = NodeCreate(
        #     title=title,
        #     node_type=NodeType.AI_STORY, # NodeType enum 임포트 필요
        #     text_content=text_content,
        #     # story_id는 인자로 받음
        # )
        
        # # 임시 current_user (실제로는 인증 시스템을 통해 받아야 함)
        # # 이 부분은 실제 사용자 인증 로직이 구현되면 변경되어야 합니다.
        # temp_user = db_session.query(User).first()
        # if not temp_user:
        #      print("AI 노드 생성 실패: 임시 사용자를 찾을 수 없습니다.")
        #      return None

        # created_node = node_service.create_node(db=db_session, node_in=new_node_data, story_id=story_id, current_user=temp_user)
        # print(f"LLM AI 노드 생성 완료: 노드 ID {created_node.id}, 스토리 ID {story_id}, 입력 '{user_input}'")
        # return created_node
        print(f"LLM AI 노드 동적 생성 시도: 스토리 ID {story_id}, 입력 '{user_input}' (LLM 연동 구현 필요)")
        # raise NotImplementedError("AI 노드 동적 생성 기능은 구현되지 않았습니다.")
        return None # 임시 반환

llm_service = LLMService()
