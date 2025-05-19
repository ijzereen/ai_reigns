import uuid
from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.crud import crud_story, crud_user # crud_user for author info
from app.schemas import story as story_schema
from app.models import story as story_model

# Placeholder for the initial graph function - this needs to be properly defined or imported
def _create_initial_story_graph() -> story_schema.StoryGraph:
    """Creates a default initial graph with a STORY_START node."""
    start_node_id = str(uuid.uuid4())
    return story_schema.StoryGraph(
        nodes=[
            story_schema.Node(
                id=start_node_id,
                type="STORY_START",
                data=story_schema.NodeData(
                    label="시작",
                    text_content="모험이 시작됩니다."
                ),
                position={"x": 250, "y": 150}
            )
        ],
        edges=[]
    )

def transform_graph_for_db(graph_json: Optional[story_schema.StoryGraph]) -> Optional[story_schema.StoryGraph]:
    """Validates or transforms graph_json before DB storage."""
    return graph_json

def transform_graph_for_response(graph_json: Optional[story_schema.StoryGraph]) -> Optional[story_schema.StoryGraph]:
    """Transforms graph_json for API response if needed."""
    return graph_json

def create_story(db: Session, story_create: story_schema.StoryCreate, user_id: int) -> story_schema.Story:
    author = crud_user.get(db, id=user_id)
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author (user) not found.")

    final_graph_json: story_schema.StoryGraph
    if story_create.graph_json is not None:
        try:
            transformed_graph = transform_graph_for_db(story_create.graph_json)
            if transformed_graph is None: 
                final_graph_json = _create_initial_story_graph()
            else:
                final_graph_json = transformed_graph
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid graph_json: {str(e)}")
    else:
        final_graph_json = _create_initial_story_graph()

    story_data_for_db = story_create.model_dump(exclude_none=True, exclude={'graph_json'}) 

    story_db_create = story_schema.StoryInDBBase(
        **story_data_for_db, 
        id=str(uuid.uuid4()), # Ensure ID is generated if not part of StoryInDBBase by default from client
        user_id=user_id,
        graph_json=final_graph_json 
    )
    
    # Use the specific create_story method from crud_story if it exists and is intended
    created_story_db_model = crud_story.create_story(db=db, story_create=story_db_create) 
    
    response_story = story_schema.Story.from_orm(created_story_db_model)
    response_story.author_username = author.username 

    return response_story

def get_story(db: Session, story_id: str, user_id: int) -> Optional[story_schema.Story]:
    story_orm = crud_story.get_story_by_id_and_owner(
        db=db, story_id=story_id, owner_id=user_id
    )
    if not story_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or you don't have permission to view it.")
    
    response_story = story_schema.Story.from_orm(story_orm)
    response_story.graph_json = transform_graph_for_response(story_orm.graph_json) 
    if story_orm.author:
        response_story.author_username = story_orm.author.username
    return response_story

def get_my_stories(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[story_schema.Story]:
    stories_orm = crud_story.get_stories_by_user(
        db=db, user_id=user_id, skip=skip, limit=limit
    )
    response_stories = []
    for story_orm in stories_orm:
        story_resp = story_schema.Story.from_orm(story_orm)
        story_resp.graph_json = transform_graph_for_response(story_orm.graph_json)
        if story_orm.author:
            story_resp.author_username = story_orm.author.username
        response_stories.append(story_resp)
    return response_stories

def update_story(
    db: Session, story_id: str, story_update: story_schema.StoryUpdate, user_id: int
) -> Optional[story_schema.Story]:
    db_story_orm = crud_story.get_story_by_id_and_owner(
        db=db, story_id=story_id, owner_id=user_id
    )
    if not db_story_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or you don't have permission to update it.")
    
    # Use the specific update_story from crud_story if it matches the desired logic
    # The CRUDBase.update (which crud_story.update_story calls if not overridden differently)
    # should handle partial updates from StoryUpdate schema.
    updated_story_orm = crud_story.update_story(db=db, db_obj=db_story_orm, obj_in=story_update)
    # The service layer previously did manual setattr, this uses the CRUD layer method.
    # Ensure crud_story.update_story correctly handles graph_json updates if obj_in has it.
    # If crud_story.update_story just calls super().update, and StoryUpdate has graph_json: Optional[StoryGraph],
    # and Story model has graph_json, it should work if Pydantic model_dump(exclude_unset=True) is used by CRUDBase.update.
    
    response_story = story_schema.Story.from_orm(updated_story_orm)
    if updated_story_orm.author:
        response_story.author_username = updated_story_orm.author.username

    return response_story

def delete_story(db: Session, story_id: str, user_id: int) -> Optional[story_schema.Story]:
    story_to_delete_orm = crud_story.get_story_by_id_and_owner(
        db=db, story_id=story_id, owner_id=user_id
    )
    if not story_to_delete_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or you don't have permission to delete it.")
    
    response_data = story_schema.Story.from_orm(story_to_delete_orm)
    if story_to_delete_orm.author:
        response_data.author_username = story_to_delete_orm.author.username

    # Use the specific remove_story from crud_story
    crud_story.remove_story(db=db, story_id=story_id)
    return response_data

def generate_ai_elements(current_graph_json: story_schema.StoryGraph, ai_params: story_schema.AIGenerationRequest) -> story_schema.StoryGraph:
    # Placeholder for LLM interaction
    # This function would take current_graph_json and ai_params, 
    # construct a prompt, call LLM, and parse the response to update/extend the StoryGraph.
    print(f"AI Generation called with source node: {ai_params.source_node_id}, prompt: {ai_params.generation_prompt}")
    # Example: Simply return the input graph for now, or add a dummy node/edge
    # new_nodes = list(current_graph_json.nodes) # Make a copy
    # new_node_id = f"ai_node_{str(uuid.uuid4())[:4]}"
    # new_nodes.append(story_schema.Node(
    #     id=new_node_id,
    #     type="STORY",
    #     data=story_schema.NodeData(label="AI Generated Choice", text_content="This choice was AI generated."),
    #     position={"x": current_graph_json.nodes[-1].position['x'] + 100, "y": current_graph_json.nodes[-1].position['y']}
    # ))
    # return story_schema.StoryGraph(nodes=new_nodes, edges=list(current_graph_json.edges))
    return current_graph_json 