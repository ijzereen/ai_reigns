# app/application/services/user_service.py
# 사용자(User) 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.

from sqlalchemy.orm import Session
from fastapi import HTTPException, status # 비즈니스 로직 예외 처리를 위해 임포트

from app.domain.models.user import User # User 도메인 모델 임포트
from app.infrastructure.crud.user_crud import create_user as crud_create_user # 사용자 생성 CRUD 함수 임포트
from app.infrastructure.crud.user_crud import get_user_by_username # 사용자 이름 조회 CRUD 함수 임포트
from app.infrastructure.crud.user_crud import get_user_by_id # 사용자 ID 조회 CRUD 함수 임포트
from app.core.security import get_password_hash, verify_password # 비밀번호 해싱/검증 함수 임포트
# from app.schemas.user_schema import UserCreate, UserResponse # 스키마는 Presentation 계층에서 주로 사용되지만,
#                                                             # 서비스 입력/출력 타입 힌트로 사용할 수 있습니다.

class UserService:
    """
    사용자 관련 비즈니스 로직을 제공하는 서비스 클래스.
    Infrastructure 계층의 CRUD 함수를 사용하여 데이터를 조작하고,
    추가적인 비즈니스 규칙을 적용합니다.
    """

    def create_user(self, db: Session, username: str, password: str) -> User:
        """
        새로운 사용자를 생성하는 비즈니스 로직.
        - 사용자 이름 중복 확인
        - 비밀번호 해싱
        - 데이터베이스에 사용자 저장 (CRUD 함수 사용)

        Args:
            db: 데이터베이스 세션 객체.
            username: 생성할 사용자의 이름.
            password: 사용자의 비밀번호 (해싱 전).

        Returns:
            생성된 User 도메인 모델 객체.

        Raises:
            HTTPException: 사용자 이름이 이미 존재하는 경우.
        """
        # 1. 비즈니스 규칙 적용: 사용자 이름 중복 확인
        db_user = get_user_by_username(db, username=username)
        if db_user:
            # 중복된 사용자 이름이면 예외 발생
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )

        # 2. 비즈니스 로직: 비밀번호 해싱 (보안 유틸리티 사용)
        # app.core.security 모듈의 get_password_hash 함수를 호출합니다.
        hashed_password = get_password_hash(password)

        # 3. Infrastructure 계층 호출: 데이터베이스에 사용자 저장
        # app.infrastructure.crud.user_crud 모듈의 create_user 함수를 호출합니다.
        return crud_create_user(db=db, username=username, hashed_password=hashed_password)

    def get_user_by_id(self, db: Session, user_id: int) -> User:
        """
        사용자 ID로 사용자를 조회하는 비즈니스 로직.
        - 사용자가 존재하지 않으면 예외 발생

        Args:
            db: 데이터베이스 세션 객체.
            user_id: 조회할 사용자의 ID.

        Returns:
            조회된 User 도메인 모델 객체.

        Raises:
            HTTPException: 사용자를 찾을 수 없는 경우.
        """
        # Infrastructure 계층 호출: 사용자 ID로 조회
        db_user = get_user_by_id(db, user_id)
        if db_user is None:
            # 사용자를 찾지 못하면 예외 발생
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return db_user

    def authenticate_user(self, db: Session, username: str, password: str) -> User | None:
        """
        사용자 이름과 비밀번호로 사용자를 인증하는 비즈니스 로직.
        - 사용자 이름으로 조회
        - 해시된 비밀번호와 입력된 비밀번호 비교

        Args:
            db: 데이터베이스 세션 객체.
            username: 사용자가 입력한 사용자 이름.
            password: 사용자가 입력한 비밀번호.

        Returns:
            인증 성공 시 User 도메인 모델 객체, 실패 시 None.
        """
        # 1. Infrastructure 계층 호출: 사용자 이름으로 조회
        user = get_user_by_username(db, username=username)
        if not user:
            # 사용자를 찾을 수 없으면 인증 실패
            return None

        # 2. 비즈니스 로직: 비밀번호 검증 (보안 유틸리티 사용)
        # app.core.security 모듈의 verify_password 함수를 호출합니다.
        if not verify_password(password, user.hashed_password):
            # 비밀번호가 일치하지 않으면 인증 실패
            return None

        # 인증 성공 시 사용자 객체 반환
        return user


    # TODO: 다른 사용자 관련 비즈니스 로직 메서드들 추가
    # - get_users (모든 사용자 조회)
    # - update_user (사용자 정보 수정)
    # - delete_user (사용자 삭제)
    # - JWT 토큰 생성 관련 로직 (authenticate_user 성공 후 호출)
    # ...

# 참고: FastAPI의 의존성 주입 시스템에 UserService 인스턴스를 제공하기 위해
# app/core/deps.py 파일에 다음과 같은 헬퍼 함수를 추가할 수 있습니다.
#
# # app/core/deps.py (추가 내용)
# from sqlalchemy.orm import Session
# from . import services # services 디렉토리를 패키지로 임포트
# from .deps import get_db # get_db 함수 임포트
#
# # UserService 인스턴스를 제공하는 의존성 함수
# # 서비스는 DB 세션에 의존하므로 get_db를 Depends로 주입받습니다.
# def get_user_service(db: Session = Depends(get_db)) -> services.user_service.UserService:
#     """
#     UserService 인스턴스를 제공하는 의존성 함수.
#     """
#     # UserService 인스턴스 생성 시 필요한 의존성(DB 세션)을 전달할 수 있습니다.
#     # 현재 UserService는 메서드에서 db 세션을 받으므로 인스턴스 생성 시에는 필요 없습니다.
#     return services.user_service.UserService()

# UserService 클래스의 인스턴스 생성
user_service = UserService()
