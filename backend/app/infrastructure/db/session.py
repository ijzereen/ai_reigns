# app/infrastructure/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker # sessionmaker 임포트 확인

from app.core.config import settings # core.config에서 설정 값을 가져옵니다.

# SQLALCHEMY_DATABASE_URL 대신 settings.SYNC_DATABASE_URL을 직접 사용합니다.
# SYNC_DATABASE_URL 속성이 실제 접속 문자열을 반환하도록 config.py에 정의되어 있습니다.
engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# (선택 사항) 데이터베이스 테이블 자동 생성 로직 (Alembic을 사용하므로 주석 처리 또는 삭제 권장)
# from app.domain.models.base import Base
# Base.metadata.create_all(bind=engine) # 개발 초기에는 유용할 수 있으나, Alembic과 충돌 가능성
