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

@router.get("/stories/my", response_model=List[story_schema.StoryBase]) # Simplified for listing
def read_my_stories(
    db: Annotated[Session, Depends(deps.get_db)], 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    return story_service.get_stories_by_user(db=db, user_id=current_user.id)

@router.get("/stories/{story_id}", response_model=story_schema.Story)
def read_story(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str, 
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
    story_id: str, 
    story_in: story_schema.StoryUpdate, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    return story_service.update_story(db=db, story_id=story_id, story_update=story_in, user_id=current_user.id)

@router.delete("/stories/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)]
):
    success = story_service.delete_story(db=db, story_id=story_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or not authorized")
    return

@router.post("/play/{story_id}/proceed", response_model=story_schema.GamePlayResponse)
async def game_proceed(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], 
    story_id: str, 
    play_data: story_schema.GamePlayRequest, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)] # Assuming game play also needs auth
):
    story = story_service.get_story(db=db, story_id=story_id, user_id=current_user.id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    
    # Use the game_service_instance to process the turn
    return await game_service_instance.process_turn(story_graph=story.graph_json, play_data=play_data)

@router.post("/stories/{story_id}/ai/generate-elements", response_model=story_schema.StoryGraph)
def generate_ai_elements(
    *, 
    db: Annotated[Session, Depends(deps.get_db)], # db might not be needed if AI service is fully independent
    story_id: str, 
    ai_params: story_schema.AIGenerationRequest, 
    current_user: Annotated[user_model.User, Depends(deps.get_current_active_user)] # Auth for billing/quotas maybe
):
    story = story_service.get_story(db=db, story_id=story_id, user_id=current_user.id) # Auth check
    if not story:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    # The actual AI generation logic will be in story_service or a dedicated ai_service
    # For generate_ai_elements, current_graph_json is part of ai_params now.
    return story_service.generate_ai_elements(current_graph_json=ai_params.current_graph_json, ai_params=ai_params) 