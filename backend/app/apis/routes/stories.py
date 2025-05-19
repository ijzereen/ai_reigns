from typing import Any, List, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.apis import deps
from app.schemas import story as story_schema # Renamed for clarity
from app.services import story_service # game_service removed temporarily
from app.services.game_service import GameService # Import GameService class
from app.models import user as user_model

router = APIRouter()

# Instantiate GameService (can be managed with Depends for more complex setup)
# For simplicity here, we create one instance. If GameService had dependencies (like DB session itself, or LLM clients requiring setup),
# a factory function provided via Depends would be better.
game_service_instance = GameService()

@router.post("/stories", response_model=story_schema.Story, status_code=status.HTTP_201_CREATED)
def create_story(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_in: story_schema.StoryCreate, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    return story_service.create_story(db=db, story_create=story_in, user_id=current_user.id)

@router.get("/stories/my", response_model=List[story_schema.Story])
def read_my_stories(
    db: Annotated[Session, Depends(deps.get_db)], 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)],
    skip: int = 0, # Added skip parameter
    limit: int = 100 # Added limit parameter
):
    return story_service.get_my_stories(db=db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/stories/{story_id}", response_model=story_schema.Story)
def read_story(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str,  # Changed back from int to str
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    story = story_service.get_story(db=db, story_id=story_id, user_id=current_user.id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or not authorized")
    return story

@router.put("/stories/{story_id}", response_model=story_schema.Story)
def update_story(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str, # Changed back from int to str
    story_in: story_schema.StoryUpdate, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    return story_service.update_story(db=db, story_id=story_id, story_update=story_in, user_id=current_user.id)

@router.delete("/stories/{story_id}", response_model=story_schema.Story)
def delete_story(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str, # Changed back from int to str
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    deleted_story = story_service.delete_story(db=db, story_id=story_id, user_id=current_user.id)
    if not deleted_story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or not authorized for deletion")
    return deleted_story

@router.post("/play/{story_id}/proceed", response_model=story_schema.GamePlayResponse)
async def game_proceed(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str, # Changed back from int to str
    play_data: story_schema.GamePlayRequest, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    story = story_service.get_story(db=db, story_id=story_id, user_id=current_user.id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    
    if not story.graph_json:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Story graph is not available.")

    return await game_service_instance.process_turn(story_graph=story.graph_json, play_data=play_data)

@router.post("/stories/{story_id}/ai/generate-elements", response_model=story_schema.StoryGraph)
def generate_ai_elements(
    *, 
    db: Annotated[Session, Depends(deps.get_db)],
    story_id: str, # Changed back from int to str
    ai_params: story_schema.AIGenerationRequest, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    story = story_service.get_story(db=db, story_id=story_id, user_id=current_user.id)
    if not story:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    if not ai_params.current_graph_json:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Current story graph is required for AI generation.")

    return story_service.generate_ai_elements(current_graph_json=ai_params.current_graph_json, ai_params=ai_params) 