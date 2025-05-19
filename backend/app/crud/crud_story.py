from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder # For updating graph_json
import uuid # For story ID

from app.crud.base import CRUDBase
from app.models.story import Story
from app.schemas.story import StoryCreate, StoryUpdate, StoryInDBBase

class CRUDStory(CRUDBase[Story, StoryInDBBase, StoryUpdate]): # Use StoryInDBBase for creation internally
    def create_story(self, db: Session, *, story_create: StoryInDBBase) -> Story:
        # ID is already part of story_create (populated in service)
        # graph_json is also part of story_create
        db_obj = Story(**story_create.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_story(self, db: Session, story_id: str) -> Optional[Story]:
        return db.query(Story).filter(Story.id == story_id).first()

    def get_story_by_id_and_owner(
        self, db: Session, *, story_id: str, owner_id: int
    ) -> Optional[Story]:
        return (
            db.query(self.model)
            .filter(self.model.id == story_id, self.model.user_id == owner_id)
            .first()
        )

    def get_stories_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Story]:
        return (
            db.query(Story)
            .filter(Story.user_id == user_id)
            .order_by(Story.updated_at.desc()) # Example: order by last updated
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_story(
        self, db: Session, *, db_obj: Story, obj_in: StoryUpdate
    ) -> Story:
        # If obj_in contains graph_json, it will be updated by CRUDBase.update
        # CRUDBase.update handles partial updates using exclude_unset=True for Pydantic models
        return super().update(db, db_obj=db_obj, obj_in=obj_in)

    def remove_story(self, db: Session, *, story_id: str) -> Optional[Story]:
        # CRUDBase.remove expects integer ID by default if model.id is int.
        # Here, Story.id is string, so we fetch then delete.
        obj = db.query(self.model).filter(self.model.id == story_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj # Returns the deleted object or None if not found

crud_story = CRUDStory(Story) 