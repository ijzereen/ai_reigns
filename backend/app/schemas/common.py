# app/schemas/common.py
from pydantic import BaseModel, Field
from typing import Optional, TypeVar, Generic
from datetime import datetime

T = TypeVar('T')

class OrmBaseModel(BaseModel):
    """Pydantic 모델이 SQLAlchemy 모델과 잘 작동하도록 하는 기본 설정"""
    class Config:
        # Pydantic V1에서는 orm_mode = True
        # Pydantic V2에서는 from_attributes = True
        from_attributes: bool = True # SQLAlchemy 모델 인스턴스를 Pydantic 모델로 자동 변환 허용

class TimestampModel(OrmBaseModel):
    """API 응답에 포함될 id 및 타임스탬프 필드"""
    id: int
    created_at: datetime
    updated_at: datetime

class Msg(BaseModel):
    """간단한 메시지 응답을 위한 스키마"""
    message: str
