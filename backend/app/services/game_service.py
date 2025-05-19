from typing import Dict, Any, Optional, Union
from app.schemas.story import (
    Node as StoryNodeSchema, 
    Edge as StoryEdgeSchema, 
    StoryGraph as StoryGraphSchema,
    GamePlayRequest as PlayTurnRequestSchema,
    GamePlayResponse as PlayTurnResponseSchema,
    GamePlayResponseNodeData as NodeDataResponseSchema,
    NodeData as StoryNodeDataSchema # For current_node_obj.data.text_content access
)
from app.core.config import settings # For OPENAI_API_KEY if used directly
# Potentially: import openai # If using OpenAI directly

# Placeholder for LLM client initialization if needed
# if settings.OPENAI_API_KEY:
#     openai.api_key = settings.OPENAI_API_KEY

# Placeholder for StoryNodeType enum, should be imported from actual definition if it exists
# For now, using string literals directly as per the Node model's type: str field in story.py
class StoryNodeType:
    STORY_START = "STORY_START"
    STORY = "STORY"
    QUESTION = "QUESTION"
    QUESTION_INPUT = "QUESTION_INPUT"
    GAME_END = "GAME_END"

class GameService:
    def __init__(self):
        # Initialize LLM client here if it's a class instance
        pass

    async def _call_llm(self, prompt: str) -> str:
        """Placeholder for actual LLM API call."""
        # This is a placeholder. In a real scenario, you would use an LLM client.
        # For example, with OpenAI:
        # import openai
        # if settings.OPENAI_API_KEY:
        # openai.api_key = settings.OPENAI_API_KEY
        # try:
        # response = await openai.Completion.acreate(
        # engine="text-davinci-003", 
        # prompt=prompt,
        # max_tokens=150
        # )
        # return response.choices[0].text.strip()
        # except Exception as e:
        # print(f"LLM API call failed: {e}")
        # return "LLM call failed. Using fallback."
        
        # Corrected multi-line f-string for logging/debugging
        log_message = f"""--- LLM PROMPT (GameService) ---
{prompt}
--------------------------------"""
        print(log_message)
        return f"LLM simulated response to: {prompt[:50]}..."

    def _find_node_by_id(self, graph: StoryGraphSchema, node_id: str) -> Optional[StoryNodeSchema]:
        # Ensure node_id is a string for comparison, as model IDs might be UUIDs or ints then cast to str
        node_id_str = str(node_id)
        for node in graph.nodes:
            if str(node.id) == node_id_str:
                return node
        return None

    def _find_edge_by_id(self, graph: StoryGraphSchema, edge_id: str) -> Optional[StoryEdgeSchema]:
        # Ensure edge_id is a string
        edge_id_str = str(edge_id)
        for edge in graph.edges:
            if str(edge.id) == edge_id_str:
                return edge
        return None

    async def process_turn(self, story_graph: Union[StoryGraphSchema, dict], play_data: PlayTurnRequestSchema) -> PlayTurnResponseSchema:
        if isinstance(story_graph, dict):
            # If story_graph is a dict, parse it into StoryGraphSchema
            # This ensures that we are working with Pydantic models downstream
            graph_model = StoryGraphSchema(**story_graph)
        else:
            # If it's already a StoryGraphSchema instance, use it directly
            graph_model = story_graph

        current_stats = play_data.current_stats.copy() if play_data.current_stats else {}
        
        # Use graph_model instead of story_graph from here onwards
        current_node_obj = self._find_node_by_id(graph_model, play_data.current_node_id)

        if not current_node_obj:
            # This case should ideally be prevented by frontend logic or earlier checks
            # but handle defensively.
            return PlayTurnResponseSchema(
                next_node_id=play_data.current_node_id, # Stay on current node or error
                next_node_data=None, # No data if node not found
                updated_stats=current_stats,
                is_game_over=True,
                final_message="Error: Current node not found in story graph."
            )

        next_node_id: Optional[str] = None
        chosen_edge_obj: Optional[StoryEdgeSchema] = None
        
        # ... rest of the process_turn logic will use graph_model ...
        # For example, when finding the chosen edge:
        if play_data.chosen_edge_id:
            chosen_edge_obj = self._find_edge_by_id(graph_model, play_data.chosen_edge_id)
            if chosen_edge_obj:
                next_node_id = str(chosen_edge_obj.target)
                # Apply stat effects if any
                if chosen_edge_obj.data and chosen_edge_obj.data.stat_effects:
                    for stat, change in chosen_edge_obj.data.stat_effects.items():
                        current_stats[stat] = current_stats.get(stat, 0) + change
            else:
                # Edge not found, critical error or end of path without explicit GAME_END
                 return PlayTurnResponseSchema(
                    next_node_id=play_data.current_node_id, # Stay
                    next_node_data=NodeDataResponseSchema(**current_node_obj.data.model_dump()),
                    updated_stats=current_stats,
                    is_game_over=True,
                    final_message="Error: Chosen path does not exist."
                )

        # Handling for QUESTION_INPUT type (if user_input is provided)
        elif current_node_obj.type == StoryNodeType.QUESTION_INPUT and play_data.user_input is not None:
            # For QUESTION_INPUT, there's typically one outgoing edge. Find it.
            # The actual routing or outcome might depend on LLM processing of user_input later.
            # For now, assume simple progression.
            # This logic might need to be more sophisticated based on actual game design.
            outgoing_edges = [edge for edge in graph_model.edges if str(edge.source) == str(current_node_obj.id)]
            if outgoing_edges:
                chosen_edge_obj = outgoing_edges[0] # Take the first outgoing edge
                next_node_id = str(chosen_edge_obj.target)
                # Stat effects for input-based progression could also be on this edge
                if chosen_edge_obj.data and chosen_edge_obj.data.stat_effects:
                     for stat, change in chosen_edge_obj.data.stat_effects.items():
                        current_stats[stat] = current_stats.get(stat, 0) + change
            else: # No outgoing edge from a QUESTION_INPUT node - this is a dead end
                return PlayTurnResponseSchema(
                    next_node_id=play_data.current_node_id,
                    next_node_data=NodeDataResponseSchema(**current_node_obj.data.model_dump()),
                    updated_stats=current_stats,
                    is_game_over=True,
                    final_message="You've reached an end. No further path from this input."
                )
        
        # Handling for STORY node (auto-progression if only one path)
        elif current_node_obj.type == StoryNodeType.STORY:
            outgoing_edges = [edge for edge in graph_model.edges if str(edge.source) == str(current_node_obj.id)]
            if len(outgoing_edges) == 1:
                chosen_edge_obj = outgoing_edges[0]
                next_node_id = str(chosen_edge_obj.target)
                if chosen_edge_obj.data and chosen_edge_obj.data.stat_effects:
                    for stat, change in chosen_edge_obj.data.stat_effects.items():
                        current_stats[stat] = current_stats.get(stat, 0) + change
            elif not outgoing_edges: # STORY node with no outgoing edges = end of path
                 return PlayTurnResponseSchema(
                    next_node_id=play_data.current_node_id,
                    next_node_data=NodeDataResponseSchema(**current_node_obj.data.model_dump()), # Return current node data
                    updated_stats=current_stats,
                    is_game_over=True,
                    final_message= (current_node_obj.data.text_content if hasattr(current_node_obj.data, 'text_content') and current_node_obj.data.text_content 
                                   else "The story concludes here.")
                )
            # If a STORY node has multiple outgoing edges, it's acting like a QUESTION,
            # frontend should have made user choose an edge. If chosen_edge_id was not provided,
            # it implies an issue or an unhandled state. For now, treat as error or stay.
            # This might indicate an issue with frontend sending play_data or story structure.

        # If no next_node_id determined (e.g. QUESTION node with no edge chosen by frontend yet)
        if not next_node_id and current_node_obj.type == StoryNodeType.QUESTION:
            # This means the frontend is showing a QUESTION node, and waiting for user to pick an edge.
            # In this case, we just return the current node's data, as no progression happened.
            # This call to process_turn might be redundant if frontend handles this state.
            # However, if it's called, we respond without changing node.
            return PlayTurnResponseSchema(
                next_node_id=str(current_node_obj.id),
                next_node_data=NodeDataResponseSchema(**current_node_obj.data.model_dump()),
                updated_stats=current_stats,
                is_game_over=False, # Not game over, just no progression on this turn
                final_message=""
            )
            
        if not next_node_id: # If still no next_node_id after all logic, it's an issue or unhandled end
            return PlayTurnResponseSchema(
                next_node_id=play_data.current_node_id,
                next_node_data=NodeDataResponseSchema(**current_node_obj.data.model_dump()),
                updated_stats=current_stats,
                is_game_over=True,
                final_message="You've reached an impasse. No clear path forward."
            )

        next_node_obj = self._find_node_by_id(graph_model, next_node_id)

        if not next_node_obj:
            # Critical error: edge points to a non-existent node
            return PlayTurnResponseSchema(
                next_node_id=str(current_node_obj.id), # Stay on current node
                next_node_data=NodeDataResponseSchema(**current_node_obj.data.model_dump()),
                updated_stats=current_stats,
                is_game_over=True,
                final_message=f"Error: Path leads to an invalid node ID ({next_node_id})."
            )

        # Check if the next node is a game end node
        is_game_over = (next_node_obj.type == StoryNodeType.GAME_END)
        final_msg = (next_node_obj.data.text_content if hasattr(next_node_obj.data, 'text_content') and next_node_obj.data.text_content 
                     else "") if is_game_over else ""
        
        # If GAME_END node has no further text_content, provide a generic one
        if is_game_over and not final_msg:
            final_msg = "The game has concluded."


        return PlayTurnResponseSchema(
            next_node_id=str(next_node_obj.id),
            next_node_data=NodeDataResponseSchema(**next_node_obj.data.model_dump()),
            updated_stats=current_stats,
            is_game_over=is_game_over,
            final_message=final_msg
        )

# Instantiate if you want to use it as a singleton injected via Depends
# game_service_instance = GameService() 