# app/schemas/user_schema.py
# 사용자 관련 Pydantic 스키마를 정의합니다.
# API 요청/응답 데이터의 형태와 유효성 검사에 사용됩니다.

from pydantic import BaseModel, EmailStr, Field # Pydantic BaseModel 임포트
from typing import Optional

# 사용자 생성 요청 스키마
class UserCreate(BaseModel):
    """
    새로운 사용자 생성 요청 시 사용되는 스키마.
    프론트엔드의 POST /users/ 요청 본문 형태에 해당합니다.
    """
    username: str = Field(..., min_length=3, max_length=50) # 사용자 이름 (필수, 길이 제한)
    password: str = Field(..., min_length=6) # 비밀번호 (필수, 최소 길이 제한)
    # email: Optional[EmailStr] = None # 이메일 (선택 사항, 이메일 형식 검증)
    # TODO: 프론트엔드 요구사항에 email 필드가 있다면 추가합니다. 현재는 username/password만 명시됨.

# 사용자 정보 응답 스키마
class UserRead(BaseModel):
    """
    사용자 정보를 클라이언트에게 응답할 때 사용되는 스키마.
    민감한 정보(예: 해시된 비밀번호)는 포함하지 않습니다.
    프론트엔드의 UserRead 형태에 해당합니다.
    """
    id: int # 사용자 고유 ID
    username: str # 사용자 이름
    # email: Optional[EmailStr] = None # 이메일 (필요시 추가)
    # TODO: 다른 사용자 관련 정보가 있다면 추가합니다.

    # ORM 모드를 활성화하여 SQLAlchemy 모델 객체에서 Pydantic 모델로 변환할 수 있도록 합니다.
    class Config:
        orm_mode = True # Deprecated in Pydantic v2, use from_orm=True in BaseModel

# Pydantic v2+ 호환 (orm_mode 대신 from_attributes=True 사용)
class UserReadV2(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True # SQLAlchemy 모델 객체에서 속성을 읽어오도록 설정

# Access Token 응답 스키마 (프론트엔드의 { access_token, token_type, user: UserRead } 형태)
class Token(BaseModel):
    """
    로그인 성공 시 Access Token 정보를 응답할 때 사용되는 스키마.
    프론트엔드의 응답 형태에 해당합니다.
    """
    access_token: str # 발급된 Access Token
    token_type: str = "bearer" # 토큰 타입 (일반적으로 "bearer")
    user: UserReadV2 # 인증된 사용자 정보 (UserRead 스키마 사용)

# 참고: OAuth2PasswordRequestForm 스키마는 FastAPI Security에서 제공하므로 별도 정의 필요 없습니다.
# from fastapi.security import OAuth2PasswordRequestForm # 로그인 요청 본문 스키마
