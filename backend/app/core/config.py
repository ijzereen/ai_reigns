# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Interactive Story Game API"
    API_V1_STR: str = "/api/v1"

    # .env 파일에서 직접 DATABASE_URL을 읽어오도록 설정
    DATABASE_URL: str # 예: "postgresql://won:mypassword123@localhost:5432/app_db"

    # JWT 토큰 설정
    SECRET_KEY: str = "a_very_secret_key_for_jwt_please_change_this" # 실제 운영 시 반드시 변경
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 예: 7일

    # LLM API 키
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # CORS 설정 (필요시)
    # BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"] # 프론트엔드 주소 예시

    model_config = SettingsConfigDict(
        env_file=".env", # .env 파일 사용 명시
        env_file_encoding='utf-8',
        case_sensitive=False, # .env 파일의 변수 이름 대소문자 구분 안 함
        extra='ignore' # Settings 모델에 정의되지 않은 .env 변수는 무시
    )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        # DATABASE_URL 필드를 직접 반환 (Alembic 및 동기 DB 연결에 사용)
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set in the environment variables.")
        return self.DATABASE_URL

    @property
    def ASYNC_DATABASE_URL(self) -> Optional[str]:
        # 비동기 드라이버 사용 시 (현재는 미사용)
        # if self.DATABASE_URL:
        #     return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
        return None

@lru_cache() # 설정 객체는 한 번만 로드하도록 캐싱
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

# --- .env 파일에 다음과 같은 형식으로 실제 값이 있는지 다시 한번 꼼꼼히 확인해주세요 ---
# DATABASE_URL="postgresql://실제사용자이름:실제비밀번호@실제호스트주소:실제포트번호/실제데이터베이스이름"
# OPENAI_API_KEY=실제OpenAI_API키값
# GEMINI_API_KEY=실제Gemini_API키값
# SECRET_KEY=운영용_매우_안전한_시크릿_키
# ACCESS_TOKEN_EXPIRE_MINUTES=10080
