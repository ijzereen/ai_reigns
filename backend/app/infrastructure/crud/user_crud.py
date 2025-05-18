# app/infrastructure/crud/user_crud.py
from typing import Optional, List
from sqlalchemy.orm import Session

from app.domain.models.user import User
from app.schemas.user_schema import UserCreate, UserUpdate # UserCreate, UserUpdate 임포트
from .base_crud import CRUDBase
from app.core.security import get_password_hash # 실제 해싱 함수 (추후 생성 및 임포트)

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """이메일을 기준으로 사용자를 조회합니다."""
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        """사용자 이름을 기준으로 사용자를 조회합니다."""
        return db.query(User).filter(User.username == username).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        UserCreate 스키마를 받아 사용자를 생성합니다.
        이 메소드는 CRUDBase의 create를 오버라이드하여 비밀번호 해싱을 처리합니다.
        """
        # UserCreate 스키마에서 필요한 데이터를 추출 (Pydantic V2)
        # obj_in은 UserCreate 타입이므로 password 필드를 가지고 있습니다.
        create_data = obj_in.model_dump() 
        
        plain_password = create_data.pop("password") # UserCreate에서 password를 가져옴
        
        # 실제 비밀번호 해싱 로직 (추후 app.core.security에 구현)
        hashed_password = get_password_hash(plain_password) 
        
        # User SQLAlchemy 모델에 맞는 데이터로 구성
        # UserCreate에는 email, username(Optional), password가 있고,
        # User 모델에는 email, username(Optional), hashed_password, is_active(default=True) 등이 있습니다.
        db_obj_data = {
            "email": create_data.get("email"),
            "username": create_data.get("username"), # username은 Optional
            "hashed_password": hashed_password 
            # is_active는 User 모델 정의에서 default=True로 설정되어 있으므로 여기서 명시적으로 전달 X
        }
        
        # username이 None이고 User 모델에서 username이 필수라면 여기서 처리 필요
        # 현재 User 모델에서 username은 nullable=True이므로 None으로 저장될 수 있음
        if db_obj_data["username"] is None:
            # 만약 DB에 NULL을 허용하지 않는다면, 여기서 기본값을 설정하거나 오류 발생시켜야 함
            # 현재는 nullable=True이므로, None이면 User 객체 생성 시 username 필드를 빼거나 None으로 전달
            pass # User(**db_obj_data) 호출 시 username이 None이면 그대로 전달됨

        db_user = User(**db_obj_data)
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    # update 메소드도 필요시 오버라이드하여 비밀번호 변경 시 해싱 처리 등을 할 수 있습니다.
    # 현재는 user_service.update_user에서 임시 해싱 로직을 담당하고 있습니다.

user_crud = CRUDUser(User)
