from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func # count 사용을 위해 추가

from app.domain.models.base import Base # SQLAlchemy Base 모델

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        특정 SQLAlchemy 모델과 Pydantic 스키마를 사용하는 CRUD 객체입니다.

        :param model: SQLAlchemy 모델 클래스
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """ID를 기준으로 단일 객체를 조회합니다."""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """여러 객체를 페이지네이션하여 조회합니다."""
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def get_count(self, db: Session) -> int:
        """테이블의 전체 레코드 수를 반환합니다."""
        return db.query(func.count(self.model.id)).scalar()


    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """새로운 객체를 생성합니다."""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)  # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """기존 객체를 수정합니다."""
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True) # Pydantic V1
            # Pydantic V2: update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Optional[ModelType]:
        """ID를 기준으로 객체를 삭제합니다."""
        obj = db.query(self.model).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj