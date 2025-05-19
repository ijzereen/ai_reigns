from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

# Node and Edge data structures for StoryGraph
class NodeData(BaseModel):
    label: str
    text_content: str
    characterName: Optional[str] = None
    imageUrl: Optional[str] = None
    # Type specific fields - using Optional and will be validated in service/model layer or by type value
    initial_stats: Optional[Dict[str, Any]] = None # For STORY_START
    inputPrompt: Optional[str] = None # For QUESTION_INPUT (question to user)
    llm_processing_prompt: Optional[str] = None # For QUESTION_INPUT (how LLM processes answer)
    ending_type: Optional[str] = None # For END (GOOD, BAD, CUSTOM)
    ending_message_prompt: Optional[str] = None # For END (LLM prompt for ending text)

class Node(BaseModel):
    id: str # Frontend generated UUID
    type: str # STORY_START, STORY, QUESTION, QUESTION_INPUT, END
    data: NodeData
    position: Dict[str, float] # { "x": 0, "y": 0 }

class EdgeData(BaseModel):
    stat_effects: Optional[Dict[str, Any]] = None

class Edge(BaseModel):
    id: str # Frontend generated UUID
    source: str
    target: str
    label: Optional[str] = None
    type: Optional[str] = "smoothstep"
    markerEnd: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"type": "ArrowClosed"})
    data: EdgeData = Field(default_factory=EdgeData)

class StoryGraph(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

# Story Schemas
class StoryBase(BaseModel):
    title: str
    description: Optional[str] = None

class StoryCreate(StoryBase):
    graph_json: Optional[StoryGraph] = None # Added graph_json field

class StoryUpdate(StoryBase):
    title: Optional[str] = None # Allow partial updates
    description: Optional[str] = None
    graph_json: Optional[StoryGraph] = None

class StoryInDBBase(StoryBase):
    id: str # Backend generated UUID for the story itself
    user_id: int # Foreign key to User
    graph_json: StoryGraph

    class Config:
        from_attributes = True

class Story(StoryInDBBase):
    author_username: Optional[str] = None # To be populated in service layer
    pass

# Game Play Schemas
class GamePlayRequest(BaseModel):
    current_node_id: str
    chosen_edge_id: Optional[str] = None
    user_input: Optional[str] = None
    current_stats: Dict[str, Any]

class GamePlayResponseNodeData(BaseModel): # Subset of NodeData for response
    label: str
    text_content: str
    characterName: Optional[str] = None
    imageUrl: Optional[str] = None
    inputPrompt: Optional[str] = None
    ending_type: Optional[str] = None

class GamePlayResponse(BaseModel):
    next_node_id: str
    next_node_data: GamePlayResponseNodeData
    updated_stats: Dict[str, Any]
    is_game_over: bool
    final_message: Optional[str] = None

# AI Generation Schemas
class AIGenerationRequest(BaseModel):
    current_graph_json: StoryGraph
    source_node_id: str
    generation_prompt: str
    num_choices_to_generate: Optional[int] = 2 