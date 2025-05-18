from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    """액세스 토큰 응답 스키마"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """토큰 페이로드(내용) 스키마 (예: 사용자 식별자)"""
    sub: Optional[str] = None # "subject" - 토큰의 주체 (예: 사용자 이메일 또는 ID)