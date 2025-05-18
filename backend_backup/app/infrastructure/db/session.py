# app/infrastructure/db/session.py
# 데이터베이스 연결 엔진과 세션 생성을 설정합니다.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator

from app.core.config import settings # core.config에서 설정 값을 가져옵니다.
# from app.domain.models.base import Base # ORM 모델의 Base를 임포트합니다. (필요 시)

# 데이터베이스 연결 URL을 설정에서 가져옵니다.
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# SQLAlchemy 엔진 생성
# pool_pre_ping=True는 데이터베이스 연결이 유효한지 확인하여 끊어진 연결 문제를 방지합니다.
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

# 데이터베이스 세션 팩토리 생성
# autocommit=False: 트랜잭션이 자동으로 커밋되지 않도록 설정합니다.
# autoflush=False: 세션에 객체가 추가/수정되어도 자동으로 DB에 반영되지 않도록 설정합니다. 명시적으로 flush() 또는 commit() 필요.
# bind=engine: 생성된 엔진과 세션을 연결합니다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 데이터베이스 세션을 얻는 의존성 함수
# FastAPI의 Depends와 함께 사용하여 요청별 데이터베이스 세션을 제공합니다.
def get_db() -> Generator:
    """
    데이터베이스 세션을 생성하고 반환하는 제너레이터 함수.
    요청 처리가 끝나면 세션을 닫습니다.
    """
    db = SessionLocal() # 세션 생성
    try:
        yield db # 세션 반환 (FastAPI의 Depends가 이 부분을 사용)
    finally:
        db.close() # 요청 처리가 끝나면 세션 닫기

# 참고: 데이터베이스 테이블을 실제로 생성하는 코드는 일반적으로 마이그레이션 도구(Alembic 등)를 사용하거나
# 개발 초기 단계에서는 이 파일 또는 별도의 스크립트에서 Base.metadata.create_all(bind=engine)을 호출하여 수행합니다.
# 프로덕션 환경에서는 마이그레이션 도구 사용이 권장됩니다.
