import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.crud import crud_story, crud_user # Added crud_user
from app.schemas import story as story_schema
from app.models import story as story_model

# Helper to create initial graph for a new story
def _create_initial_story_graph() -> story_schema.StoryGraph:
    start_node_id = str(uuid.uuid4())
    return story_schema.StoryGraph(
        nodes=[
            story_schema.Node(
                id=start_node_id,
                type="STORY_START",
                data=story_schema.NodeData(
                    label="스토리 시작",
                    text_content="모험이 시작됩니다...",
                    initial_stats={}
                ),
                position={"x": 50, "y": 150}
            )
        ],
        edges=[]
    )

def create_story(db: Session, story_create: story_schema.StoryCreate, user_id: int) -> story_model.Story:
    initial_graph = _create_initial_story_graph()
    story_db_create = story_schema.StoryInDBBase(
        **story_create.model_dump(), 
        id=str(uuid.uuid4()), # Story ID
        user_id=user_id, 
        graph_json=initial_graph
    )
    created_story = crud_story.create_story(db=db, story_create=story_db_create)
    # Populate author_username for the response
    author = crud_user.get_user(db, user_id=user_id)
    if author:
        created_story.author_username = author.username
    return created_story

def get_story(db: Session, story_id: str, user_id: int) -> Optional[story_model.Story]:
    story = crud_story.get_story(db, story_id=story_id)
    if story and story.user_id == user_id:
        author = crud_user.get_user(db, user_id=story.user_id)
        if author:
            story.author_username = author.username
        return story
    return None

def get_stories_by_user(db: Session, user_id: int) -> List[story_model.Story]:
    stories = crud_story.get_stories_by_user(db, user_id=user_id)
    for story in stories:
        author = crud_user.get_user(db, user_id=story.user_id)
        if author:
            story.author_username = author.username
    return stories

def update_story(db: Session, story_id: str, story_update: story_schema.StoryUpdate, user_id: int) -> Optional[story_model.Story]:
    story = crud_story.get_story(db, story_id=story_id)
    if not (story and story.user_id == user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found or not authorized")
    updated_story = crud_story.update_story(db=db, db_obj=story, obj_in=story_update)
    author = crud_user.get_user(db, user_id=updated_story.user_id)
    if author:
        updated_story.author_username = author.username
    return updated_story

def delete_story(db: Session, story_id: str, user_id: int) -> bool:
    story = crud_story.get_story(db, story_id=story_id)
    if not (story and story.user_id == user_id):
        return False
    crud_story.remove_story(db=db, story_id=story_id)
    return True

def generate_ai_elements(current_graph_json: story_schema.StoryGraph, ai_params: story_schema.AIGenerationRequest) -> story_schema.StoryGraph:
    # Placeholder for LLM interaction
    # This function would:
    # 1. Take current_graph_json and ai_params.
    # 2. Construct a prompt for an LLM based on ai_params.generation_prompt, 
    #    ai_params.source_node_id, and potentially context from current_graph_json.
    # 3. Call the LLM to get suggestions for new nodes and edges.
    # 4. Parse LLM response and format it into new Node and Edge Pydantic models.
    #    Ensure new node/edge IDs are unique (e.g., using uuid.uuid4()).
    # 5. Add these new elements to a copy of current_graph_json.nodes and current_graph_json.edges.
    # 6. Return the modified StoryGraph.
    
    print(f"AI Generation called for source node: {ai_params.source_node_id}")
    print(f"Prompt: {ai_params.generation_prompt}")
    print(f"Num choices: {ai_params.num_choices_to_generate}")
    
    # Example: Add a dummy node and edge for demonstration
    new_graph = current_graph_json.model_copy(deep=True)
    
    new_node_id = str(uuid.uuid4())
    new_node = story_schema.Node(
        id=new_node_id,
        type="STORY", # Or based on LLM output
        data=story_schema.NodeData(
            label="AI Generated Node",
            text_content=f"This node was AI generated based on prompt: {ai_params.generation_prompt[:30]}..."
        ),
        position={"x": 300, "y": 300} # Position would need smarter placement
    )
    new_graph.nodes.append(new_node)

    if ai_params.source_node_id in [node.id for node in current_graph_json.nodes]:
        new_edge = story_schema.Edge(
            id=str(uuid.uuid4()),
            source=ai_params.source_node_id,
            target=new_node_id,
            label="AI Generated Choice"
        )
        new_graph.edges.append(new_edge)
    
    return new_graph 