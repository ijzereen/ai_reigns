# app/schemas/stat_schema.py
from typing import Optional
from pydantic import Field # Field 임포트 추가

from .common import OrmBaseModel, TimestampModel # 공통 스키마 임포트

class StatBase(OrmBaseModel):
    name: str = Field(..., example="평판", description="스탯의 이름")
    description: Optional[str] = Field(None, example="주변 캐릭터들의 주인공에 대한 인식도", description="스탯에 대한 설명")
    initial_value: int = Field(0, example=50, description="해당 스탯의 기본 시작 값")
    min_value: Optional[int] = Field(0, example=0, description="스탯의 최소값")
    max_value: Optional[int] = Field(100, example=100, description="스탯의 최대값")

class StatCreate(StatBase):
    # story_id는 API 경로 파라미터나 서비스 로직에서 주입됩니다.
    pass

class StatUpdate(OrmBaseModel):
    name: Optional[str] = Field(None, example="명성", description="새로운 스탯 이름")
    description: Optional[str] = Field(None, example="왕국 전체에 알려진 주인공의 명성도", description="새로운 스탯 설명")
    initial_value: Optional[int] = Field(None, example=60, description="새로운 초기값")
    min_value: Optional[int] = Field(None, example=0)
    max_value: Optional[int] = Field(None, example=200)

class StatRead(StatBase, TimestampModel): # TimestampModel 상속으로 id, created_at, updated_at 포함
    story_id: int = Field(..., description="이 스탯 설정이 속한 스토리의 ID")
