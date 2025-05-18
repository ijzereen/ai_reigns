# app/core/security.py
# 애플리케이션 보안 관련 유틸리티 함수들을 정의합니다.
# 비밀번호 해싱 및 검증, JWT 토큰 생성/검증 등의 코드가 포함됩니다.

from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Union, Any
from jose import JWTError, jwt # JWT 처리를 위해 임포트

from app.core.config import settings # 설정 값 임포트

# 비밀번호 해싱/검증 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 비밀번호 해싱 함수
def get_password_hash(password: str) -> str:
    """
    주어진 비밀번호를 해싱합니다.

    Args:
        password: 해싱할 원본 비밀번호 문자열.

    Returns:
        해시화된 비밀번호 문자열.
    """
    # pwd_context의 hash 메서드를 사용하여 비밀번호를 해싱합니다.
    return pwd_context.hash(password)

# 비밀번호 검증 함수
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    원본 비밀번호와 해시된 비밀번호가 일치하는지 검증합니다.

    Args:
        plain_password: 사용자가 입력한 원본 비밀번호 문자열.
        hashed_password: 데이터베이스에 저장된 해시화된 비밀번호 문자열.

    Returns:
        두 비밀번호가 일치하면 True, 그렇지 않으면 False.
    """
    # pwd_context의 verify 메서드를 사용하여 비밀번호 일치를 검증합니다.
    # 이 함수는 안전하게 비교하며 타이밍 공격을 방지합니다.
    return pwd_context.verify(plain_password, hashed_password)

# JWT 토큰 생성 함수
def create_access_token(data: dict[str, Any], expires_delta: Union[timedelta, None] = None) -> str:
    """
    Payload 데이터를 포함하는 Access Token을 생성합니다.

    Args:
        data: 토큰에 포함될 데이터 (딕셔너리 형태). 사용자 ID 등 식별 정보 포함.
        expires_delta: 토큰 만료 시간 (timedelta 객체). None이면 기본 설정 값 사용.

    Returns:
        생성된 JWT Access Token 문자열.
    """
    to_encode = data.copy() # 원본 데이터 복사
    if expires_delta:
        expire = datetime.utcnow() + expires_delta # 만료 시간 설정
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # 기본 만료 시간 사용

    # payload에 만료 시간 추가 (JWT 표준 클레임 'exp')
    to_encode.update({"exp": expire})

    # JWT 인코딩 (payload, 비밀 키, 알고리즘 사용)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# JWT 토큰 검증 함수
def verify_token(token: str) -> dict[str, Any] | None:
    """
    주어진 JWT 토큰의 유효성을 검증하고 payload 데이터를 반환합니다.

    Args:
        token: 검증할 JWT 토큰 문자열.

    Returns:
        토큰이 유효하면 payload 딕셔너리, 유효하지 않으면 None.
    """
    try:
        # JWT 디코딩 (토큰, 비밀 키, 알고리즘 사용)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # payload에서 subject(사용자 식별자) 클레임 가져오기 (일반적으로 'sub' 사용)
        # 여기서는 사용자 이름이나 ID를 'sub'에 저장할 수 있습니다.
        # 예: user_id: int = payload.get("sub")
        # if user_id is None:
        #     return None # subject 클레임이 없으면 유효하지 않은 토큰

        # 토큰이 유효하고 payload를 성공적으로 디코딩했으면 payload 반환
        return payload

    except JWTError:
        # JWT 관련 오류 발생 시 (서명 불일치, 만료 등)
        return None # 유효하지 않은 토큰으로 처리

# TODO: JWT 토큰 검증 및 사용자 객체 반환 의존성 함수 (core/deps.py에 정의)
# 이 함수는 API 엔드포인트에서 현재 인증된 사용자를 가져올 때 사용됩니다.
