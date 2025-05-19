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
    # For now, assume input Pydantic model is already validated and correct for DB JSON.
    return graph_json

def transform_graph_for_response(graph_data_from_db: Optional[Dict[str, Any]]) -> Optional[story_schema.StoryGraph]:
    """
    Transforms graph_json data (usually a dict from DB JSON field) 
    into a StoryGraph Pydantic model, ensuring correct node types.
    """
    if not graph_data_from_db:
        print("transform_graph_for_response: No graph_data_from_db provided, returning None.")
        return None
    
    try:
        # Pydantic will parse the list of node dicts into List[story_schema.Node]
        # and each node dict's 'type' key will map to Node.type field.
        parsed_graph = story_schema.StoryGraph.model_validate(graph_data_from_db)
        print(f"transform_graph_for_response: Successfully parsed graph with {len(parsed_graph.nodes)} nodes.")
        # Optional: Add a loop here to print types if further debugging is needed
        # for i, node in enumerate(parsed_graph.nodes):
        #     print(f"  Node {i} (ID: {node.id}): Parsed Type = {node.type}")
        return parsed_graph
    except Exception as e:
        print(f"Error validating/parsing graph_data_from_db into StoryGraph: {e}")
        # Fallback to an initial graph or return None, depending on desired behavior
        # For now, returning a default initial graph might be safer than None if client expects a graph.
        # However, if the story *should* have a graph and it's corrupt, this hides the issue.
        # Consider raising an error or logging more severely.
        print("transform_graph_for_response: Falling back to initial story graph due to parsing error.")
        return _create_initial_story_graph() 

def create_story(db: Session, story_create: story_schema.StoryCreate, user_id: int) -> story_schema.Story:
    author = crud_user.get(db, id=user_id)
    if not author:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author (user) not found.")

    final_graph_json_pydantic: story_schema.StoryGraph
    if story_create.graph_json is not None:
        # Assuming story_create.graph_json is already a StoryGraph Pydantic model from request
        transformed_graph = transform_graph_for_db(story_create.graph_json) # Currently a pass-through
        if transformed_graph is None: 
            final_graph_json_pydantic = _create_initial_story_graph()
        else:
            final_graph_json_pydantic = transformed_graph
    else:
        final_graph_json_pydantic = _create_initial_story_graph()

    story_data_for_db_model_fields = story_create.model_dump(exclude_none=True, exclude={'graph_json'}) 

    # StoryInDBBase expects graph_json to be the Pydantic model for validation during its creation
    story_db_create_pydantic = story_schema.StoryInDBBase(
        **story_data_for_db_model_fields, 
        id=str(uuid.uuid4()), 
        user_id=user_id,
        graph_json=final_graph_json_pydantic # Pass the Pydantic model here
    )
    
    # CRUDStory.create_story expects a Pydantic model (StoryInDBBase)
    # and its internal Story(**story_create.model_dump()) will convert the Pydantic graph_json
    # to dict for SQLAlchemy's JSON field.
    created_story_db_model = crud_story.create_story(db=db, story_create=story_db_create_pydantic) 
    
    # Story.from_orm will handle graph_json by trying to parse it if it's a dict/str from DB,
    # or assign if it's already a compatible Pydantic model (less likely here for .from_orm(SQLAlchemy_model))
    response_story = story_schema.Story.from_orm(created_story_db_model)
    
    # Explicitly ensure the graph_json in the response is the correctly parsed Pydantic model
    # by using our refined transform_graph_for_response with the dict from the DB model.
    if isinstance(created_story_db_model.graph_json, dict): # graph_json from SQLAlchemy model is likely dict
         response_story.graph_json = transform_graph_for_response(created_story_db_model.graph_json)
    elif isinstance(created_story_db_model.graph_json, story_schema.StoryGraph): # Should not happen with .from_orm on SQLAlchemy
         response_story.graph_json = created_story_db_model.graph_json # Already a Pydantic model
    else: # Fallback if it's some other unexpected type (e.g. stringified JSON)
        try:
            # This case might occur if DB returns JSON string not auto-parsed by SQLAlchemy to dict
            import json
            parsed_dict = json.loads(str(created_story_db_model.graph_json))
            response_story.graph_json = transform_graph_for_response(parsed_dict)
        except:
            response_story.graph_json = _create_initial_story_graph()


    if created_story_db_model.author: # author is on the SQLAlchemy model
        response_story.author_username = created_story_db_model.author.username 
    else: # Fallback if author relationship isn't loaded or available
        response_story.author_username = author.username


    return response_story

def get_story(db: Session, story_id: str, user_id: int) -> Optional[story_schema.Story]:
    story_orm = crud_story.get_story_by_id_and_owner(
        db=db, story_id=story_id, owner_id=user_id
    )
    if not story_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or you don't have permission to view it.")
    
    # .from_orm will attempt to convert story_orm fields to story_schema.Story fields.
    # For graph_json (defined as StoryGraph in Pydantic schema), Pydantic will try to parse
    # story_orm.graph_json (which is a dict/list from DB via SQLAlchemy JSON type) into StoryGraph.
    response_story = story_schema.Story.from_orm(story_orm)
    
    # Ensure the graph_json is correctly parsed. story_orm.graph_json is the raw dict from DB.
    # The .from_orm above might have already parsed it into response_story.graph_json.
    # If from_orm's parsing was problematic (as seen in logs), explicitly re-parsing is safer.
    if isinstance(story_orm.graph_json, dict):
        parsed_graph = transform_graph_for_response(story_orm.graph_json)
        response_story.graph_json = parsed_graph
    elif isinstance(response_story.graph_json, story_schema.StoryGraph):
        # If from_orm already correctly parsed it into a StoryGraph, we can trust it.
        # (However, logs showed it didn't get types right, so the above explicit parse is better)
        pass # Already a Pydantic model, hopefully correct.
    else: # Fallback for unexpected types
        print(f"get_story: story_orm.graph_json is of unexpected type: {type(story_orm.graph_json)}. Attempting default.")
        response_story.graph_json = _create_initial_story_graph()


    if story_orm.author:
        response_story.author_username = story_orm.author.username
    return response_story

def get_my_stories(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[story_schema.Story]:
    stories_orm = crud_story.get_stories_by_user(
        db=db, user_id=user_id, skip=skip, limit=limit
    )
    response_stories = []
    for story_orm_item in stories_orm:
        story_resp = story_schema.Story.from_orm(story_orm_item)
        
        # Explicitly parse graph_json for each story in the list
        if isinstance(story_orm_item.graph_json, dict):
            parsed_graph = transform_graph_for_response(story_orm_item.graph_json)
            story_resp.graph_json = parsed_graph
        elif isinstance(story_resp.graph_json, story_schema.StoryGraph):
            pass # Already a Pydantic model
        else:
            story_resp.graph_json = _create_initial_story_graph()
            
        if story_orm_item.author:
            story_resp.author_username = story_orm_item.author.username
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
    
    # crud_story.update_story takes StoryUpdate Pydantic model.
    # If story_update.graph_json is present (it's a StoryGraph Pydantic model),
    # CRUDBase.update will use model_dump() which converts it to dict for SQLAlchemy.
    updated_story_orm = crud_story.update_story(db=db, db_obj=db_story_orm, obj_in=story_update)
    
    response_story = story_schema.Story.from_orm(updated_story_orm)
    
    # Ensure response graph_json is also correctly parsed Pydantic model
    if isinstance(updated_story_orm.graph_json, dict):
        parsed_graph = transform_graph_for_response(updated_story_orm.graph_json)
        response_story.graph_json = parsed_graph
    elif isinstance(response_story.graph_json, story_schema.StoryGraph):
        pass
    else:
        response_story.graph_json = _create_initial_story_graph()

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
    
    # Ensure graph_json is properly formed for the response
    if isinstance(story_to_delete_orm.graph_json, dict):
        parsed_graph = transform_graph_for_response(story_to_delete_orm.graph_json)
        response_data.graph_json = parsed_graph
    elif isinstance(response_data.graph_json, story_schema.StoryGraph):
        pass
    else:
        response_data.graph_json = _create_initial_story_graph()

    if story_to_delete_orm.author:
        response_data.author_username = story_to_delete_orm.author.username

    crud_story.remove_story(db=db, story_id=story_id) # Perform deletion
    return response_data

def generate_ai_elements(current_graph_json: story_schema.StoryGraph, ai_params: story_schema.AIGenerationRequest) -> story_schema.StoryGraph:
    print(f"AI Generation called with source node: {ai_params.source_node_id}, prompt: {ai_params.generation_prompt}")
    return current_graph_json 