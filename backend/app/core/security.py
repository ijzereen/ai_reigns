# 애플리케이션 보안 관련 유틸리티 함수들을 정의합니다.
# 비밀번호 해싱 및 검증, JWT 토큰 생성/검증 등의 코드가 포함될 수 있습니다.

# passlib 라이브러리에서 CryptContext를 임포트합니다.
# bcrypt 스킴을 사용하여 비밀번호를 안전하게 해싱하고 검증합니다.
from passlib.context import CryptContext

# CryptContext 인스턴스 생성
# schemes=["bcrypt"]: bcrypt 알고리즘을 사용합니다.
# deprecated="auto": 지원 중단된 스킴 사용 시 경고를 자동으로 처리합니다.
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

# TODO: JWT 토큰 생성 및 검증 관련 함수 추가 (인증 로직 구현 시 필요)
# from datetime import datetime, timedelta
# from typing import Union
# from jose import JWTError, jwt
#
# # JWT 관련 설정 (core/config.py에서 가져올 수 있습니다)
# SECRET_KEY = "your-secret-key" # 안전한 비밀 키로 변경해야 합니다.
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
#
# def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt
#
# def verify_token(token: str, credentials_exception):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise credentials_exception
#         # 토큰에 포함된 사용자 정보(예: ID)를 검증할 수 있습니다.
#         return username # 또는 사용자 ID 등 필요한 정보 반환
#     except JWTError:
#         raise credentials_exception