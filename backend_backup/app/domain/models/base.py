from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func

Base = declarative_base()

class TimestampedModel(Base):
    """
    생성 및 수정 시간을 자동으로 기록하는 기본 모델 (추상 클래스)
    실제 테이블로 생성되지 않도록 __abstract__ = True 설정
    모든 모델은 이 클래스를 상속받아 id, created_at, updated_at 필드를 갖게 됩니다.
    """
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
