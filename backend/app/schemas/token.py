from typing import Optional
from pydantic import BaseModel, EmailStr
from .user import User # User 스키마 import

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[User] = None # 사용자 정보 필드 추가

class TokenPayload(BaseModel):
    email: EmailStr | None = None # Changed from sub to email for clarity 

class TokenData(BaseModel):
    email: Optional[str] = None 