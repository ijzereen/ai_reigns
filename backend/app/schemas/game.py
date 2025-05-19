from typing import Any, Dict, Optional, List # Added List for potential use
from pydantic import BaseModel

class GameProgressRequest(BaseModel):
    current_node_id: str
    choice_id: str # Or int, depending on the type of edge ID
    # player_stats: Optional[Dict[str, Any]] = None # Add if player stats are needed

class GameProgressResponse(BaseModel):
    next_node_id: str
    message: str
    is_end_node: bool = False
    node_content: Optional[Dict[str, Any]] = None # Content of the next node (e.g., text, image URL)
    # updated_player_stats: Optional[Dict[str, Any]] = None # Updated player stats
    # available_choices: Optional[List[Dict[str, Any]]] = None # Next available choices information 