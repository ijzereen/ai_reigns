# app/core/deps.py
# FastAPI 의존성 주입 함수들을 정의합니다.

from typing import Generator
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer # JWT 인증을 위해 필요

from app.infrastructure.db.session import get_db as get_db_session # 데이터베이스 세션 의존성 임포트 (이름 충돌 방지)
from app.application.services.user_service import UserService # UserService 클래스 임포트
from app.domain.models.user import User # User 도메인 모델 임포트 (인증된 사용자 반환 시 필요)
from app.core.security import verify_token # JWT 토큰 검증 함수 임포트

# OAuth2PasswordBearer 인스턴스 생성
# tokenUrl="/api/v1/users/login/token": 클라이언트가 토큰을 얻을 엔드포인트 URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login/token")

# 데이터베이스 세션을 얻는 의존성 함수 (app.infrastructure.db.session에서 가져옴)
# 이 함수는 다른 의존성 함수나 API 엔드포인트에서 Depends(get_db) 형태로 사용됩니다.
def get_db() -> Generator:
    """
    데이터베이스 세션을 생성하고 반환하는 제너레이터 함수.
    요청 처리가 끝나면 세션을 닫습니다.
    """
    yield from get_db_session() # infrastructure/db/session의 get_db_session 함수 사용

# UserService 인스턴스를 제공하는 의존성 함수
# 이 함수는 API 엔드포인트에서 Depends(get_user_service) 형태로 사용됩니다.
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    """
    UserService 인스턴스를 제공하는 의존성 함수.
    DB 세션에 의존하므로 get_db를 Depends로 주입받습니다.
    """
    # UserService 인스턴스 생성 (필요한 경우 db 세션 등을 인자로 전달)
    # 현재 UserService 메서드는 db 세션을 인자로 받으므로 인스턴스 생성 시에는 필요 없습니다.
    return UserService()

# 현재 인증된 사용자를 가져오는 의존성 함수
# 이 함수는 보호된 API 엔드포인트에서 Depends(get_current_user) 형태로 사용됩니다.
def get_current_user(
    token: str = Depends(oauth2_scheme), # OAuth2PasswordBearer를 통해 토큰 자동 추출 및 검증
    user_service: UserService = Depends(get_user_service), # UserService 주입
    db: Session = Depends(get_db) # DB 세션 주입
) -> User:
    """
    JWT 토큰을 검증하고, 토큰에 포함된 사용자 정보로 데이터베이스에서 사용자를 조회하여 반환합니다.
    인증 실패 시 HTTPException을 발생시킵니다.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. 토큰 검증 (core.security 사용)
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception # 토큰이 유효하지 않으면 예외 발생

    # 2. 토큰 payload에서 사용자 식별 정보(예: 사용자 ID) 가져오기
    # create_access_token 함수에서 payload에 "sub" 클레임으로 사용자 ID를 저장한다고 가정합니다.
    user_id: int | None = payload.get("sub") # 'sub' 클레임에서 사용자 ID 가져오기
    if user_id is None:
        raise credentials_exception # 사용자 ID가 없으면 예외 발생

    # 3. Infrastructure 계층 호출: 사용자 ID로 데이터베이스에서 사용자 조회 (UserService 사용)
    # UserService의 get_user_by_id 메서드는 사용자가 없으면 HTTPException을 발생시킵니다.
    try:
        user = user_service.get_user_by_id(db, user_id=user_id)
    except HTTPException: # UserService에서 발생시킨 404 예외를 여기서 다시 401로 변환
         raise credentials_exception


    if user is None: # 이 경우는 UserService.get_user_by_id가 None을 반환할 때 (현재 코드는 예외 발생)
         raise credentials_exception

    return user # 인증된 사용자 객체 반환

# TODO: get_current_active_user 등 추가 인증 관련 의존성 함수 정의
