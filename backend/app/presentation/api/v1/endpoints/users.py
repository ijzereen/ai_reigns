# app/presentation/api/v1/endpoints/users.py
# 사용자(User) 관련 API 엔드포인트를 정의합니다.

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # 로그인 요청 본문 처리를 위해 필요
from sqlalchemy.orm import Session

from app.schemas.user_schema import UserCreate, UserReadV2, Token # 사용자 관련 스키마 임포트
from app.application.services.user_service import UserService # UserService 임포트
from app.core.deps import get_db, get_user_service, get_current_user # 의존성 주입 함수 임포트
from app.core.security import create_access_token # JWT 토큰 생성 함수 임포트
from app.domain.models.user import User # User 도메인 모델 임포트 (타입 힌트용)

# APIRouter 인스턴스 생성
# prefix="/users": 이 라우터에 정의된 모든 경로는 "/users"로 시작합니다.
router = APIRouter(prefix="/users", tags=["users"])

# 사용자 등록 엔드포인트 (POST /api/v1/users/)
@router.post("/", response_model=UserReadV2, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_data: UserCreate, # 요청 본문을 UserCreate 스키마로 자동 검증
    db: Session = Depends(get_db), # DB 세션 주입
    user_service: UserService = Depends(get_user_service) # UserService 주입
):
    """
    새로운 사용자를 등록합니다.
    """
    # Application Layer의 UserService를 호출하여 사용자 생성 비즈니스 로직 수행
    # UserService.create_user 메서드 내에서 중복 확인 및 비밀번호 해싱이 이루어집니다.
    try:
        created_user = user_service.create_user(db=db, username=user_data.username, password=user_data.password)
        # 생성된 User 도메인 모델 객체를 UserReadV2 스키마 형태로 변환하여 응답
        return UserReadV2.from_orm(created_user) # Pydantic v2+
        # return UserRead.from_orm(created_user) # Pydantic v1
    except HTTPException as e:
        # UserService에서 발생시킨 HTTP 예외를 그대로 반환
        raise e
    except Exception as e:
        # 예상치 못한 다른 오류 발생 시 500 Internal Server Error 반환
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during user creation: {e}"
        )


# 사용자 로그인 엔드포인트 (POST /api/v1/users/login/token)
# OAuth2PasswordRequestForm을 사용하여 클라이언트로부터 username과 password를 받습니다.
@router.post("/login/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), # OAuth2PasswordRequestForm으로 자동 파싱
    db: Session = Depends(get_db), # DB 세션 주입
    user_service: UserService = Depends(get_user_service) # UserService 주입
):
    """
    사용자 이름과 비밀번호로 로그인하고 Access Token을 발급합니다.
    """
    # 1. Application Layer의 UserService를 호출하여 사용자 인증
    user = user_service.authenticate_user(db, form_data.username, form_data.password)

    if not user:
        # 인증 실패 시 401 Unauthorized 예외 발생
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}, # 클라이언트에게 인증 방식 알림
        )

    # 2. 인증 성공 시 JWT Access Token 생성 (core.security 사용)
    # 토큰 payload에 사용자 ID를 'sub' 클레임으로 포함시킵니다.
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # 만료 시간 설정
    access_token = create_access_token(
        data={"sub": str(user.id)}, # payload에 사용자 ID 포함 (문자열로 변환)
        expires_delta=access_token_expires
    )

    # 3. Token 스키마 형태로 응답 반환
    return Token(access_token=access_token, token_type="bearer", user=UserReadV2.from_orm(user)) # Pydantic v2+
    # return Token(access_token=access_token, token_type="bearer", user=UserRead.from_orm(user)) # Pydantic v1


# 현재 인증된 사용자 정보 조회 엔드포인트 (GET /api/v1/users/me)
# Depends(get_current_user)를 사용하여 JWT 토큰 검증 및 사용자 객체 주입
@router.get("/me", response_model=UserReadV2)
def read_users_me(
    current_user: User = Depends(get_current_user) # get_current_user 의존성 주입
):
    """
    현재 인증된 사용자 정보를 조회합니다.
    Access Token이 필요하며, 토큰 검증 후 해당 사용자 정보를 반환합니다.
    """
    # get_current_user 의존성에서 이미 인증된 User 객체를 반환했으므로, 그대로 사용
    return UserReadV2.from_orm(current_user) # Pydantic v2+
    # return UserRead.from_orm(current_user) # Pydantic v1

# TODO: 다른 사용자 관련 엔드포인트 추가 (예: 사용자 정보 수정 등)
