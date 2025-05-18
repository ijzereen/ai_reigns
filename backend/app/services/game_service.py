from typing import Dict, Any, Optional
from app.schemas import story as story_schema
from app.core.config import settings # For OPENAI_API_KEY if used directly
# Potentially: import openai # If using OpenAI directly

# Placeholder for LLM client initialization if needed
# if settings.OPENAI_API_KEY:
#     openai.api_key = settings.OPENAI_API_KEY

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

    def _find_node_by_id(self, graph: story_schema.StoryGraph, node_id: str) -> Optional[story_schema.Node]:
        for node in graph.nodes:
            if node.id == node_id:
                return node
        return None

    def _find_edge_by_id(self, graph: story_schema.StoryGraph, edge_id: str) -> Optional[story_schema.Edge]:
        for edge in graph.edges:
            if edge.id == edge_id:
                return edge
        return None

    async def process_turn(
        self, 
        story_graph: story_schema.StoryGraph, 
        play_data: story_schema.GamePlayRequest
    ) -> story_schema.GamePlayResponse:
        
        current_node = self._find_node_by_id(story_graph, play_data.current_node_id)
        if not current_node:
            # This should ideally not happen if frontend sends valid data
            raise ValueError("Current node not found in story graph")

        next_node_id: Optional[str] = None
        next_node_data_override: Optional[Dict[str, Any]] = None
        final_message_override: Optional[str] = None
        updated_stats = play_data.current_stats.copy()

        if current_node.type == "STORY_START":
            # Usually, STORY_START would have one outgoing edge defined in graph
            # For simplicity, assume the first edge or a specific 'start' edge
            if story_graph.edges:
                # Find an edge originating from STORY_START
                start_edge = next((edge for edge in story_graph.edges if edge.source == current_node.id), None)
                if start_edge:
                    next_node_id = start_edge.target
                    if start_edge.data.stat_effects:
                        for stat, val in start_edge.data.stat_effects.items():
                            updated_stats[stat] = updated_stats.get(stat, 0) + val
            if not next_node_id and len(story_graph.nodes) > 1:
                 # Fallback: if no edge from start, but other nodes exist, go to first non-start node
                 # This case should be handled by good graph design in editor
                potential_next_node = next((n for n in story_graph.nodes if n.type != "STORY_START"), None)
                if potential_next_node: next_node_id = potential_next_node.id

        elif current_node.type == "STORY":
            # STORY nodes typically have one outgoing edge
            story_edge = next((edge for edge in story_graph.edges if edge.source == current_node.id), None)
            if story_edge:
                next_node_id = story_edge.target
                if story_edge.data.stat_effects:
                    for stat, val in story_edge.data.stat_effects.items():
                        updated_stats[stat] = updated_stats.get(stat, 0) + val
            # No LLM processing for basic STORY nodes in this iteration

        elif current_node.type == "QUESTION":
            if play_data.chosen_edge_id:
                chosen_edge = self._find_edge_by_id(story_graph, play_data.chosen_edge_id)
                if chosen_edge and chosen_edge.source == current_node.id:
                    next_node_id = chosen_edge.target
                    if chosen_edge.data.stat_effects:
                        for stat, val in chosen_edge.data.stat_effects.items():
                            updated_stats[stat] = updated_stats.get(stat, 0) + val
                else:
                    raise ValueError("Invalid chosen edge for QUESTION node")
            else:
                raise ValueError("chosen_edge_id is required for QUESTION node")

        elif current_node.type == "QUESTION_INPUT":
            if play_data.user_input is None:
                raise ValueError("user_input is required for QUESTION_INPUT node")

            # LLM processing for user_input
            if current_node.data.llm_processing_prompt:
                prompt_template = current_node.data.llm_processing_prompt
                # Ensure all expected keys are present in play_data or have defaults
                prompt = prompt_template.format(
                    user_input=play_data.user_input,
                    current_stats=updated_stats
                )
                # This prompt should guide LLM to output next_node_id, text, stat_effects, etc.
                # For now, we assume LLM returns a string that we parse or use directly.
                # A more robust solution would involve structured output from LLM (e.g. JSON)
                llm_response_text = await self._call_llm(prompt)
                
                # --- Crude parsing of LLM response (NEEDS ROBUST IMPLEMENTATION) ---
                # Example: LLM might respond with "NEXT_NODE_ID:abc|TEXT:You chose wisely|STAT_EFFECTS:{"wisdom":1}"
                # This is highly dependent on how you engineer your prompts and parse responses.
                # For this placeholder, we assume the LLM gives us the ID of the next node.
                # And potentially new text content for that node.

                # Find the first edge from this QUESTION_INPUT node (assuming one main path after LLM)
                # Or LLM itself could specify the target_node_id
                # For this placeholder, let's assume there is a pre-defined edge to follow
                # and LLM just modifies the content of that target or provides a new message.
                
                outgoing_edge = next((edge for edge in story_graph.edges if edge.source == current_node.id), None)
                if outgoing_edge:
                    next_node_id = outgoing_edge.target
                    # LLM might provide new text_content for the *next* node
                    next_node_data_override = {"text_content": llm_response_text} 
                    if outgoing_edge.data.stat_effects:
                         for stat, val in outgoing_edge.data.stat_effects.items():
                            updated_stats[stat] = updated_stats.get(stat, 0) + val
                else:
                    # LLM must determine the next node if no default edge exists.
                    # This part is complex and needs careful prompt engineering.
                    # For now, we might end the game or raise an error if no path.
                    print("Warning: QUESTION_INPUT LLM processing did not determine a next node and no default edge.")
                    # Fallback: Try to find ANY node to go to, or end game.
                    # For now, let's assume LLM response is just text for the current node if no edge.
                    # This means the player might be "stuck" if not designed well.
                    # A better approach: LLM returns JSON: { "next_node_id": "id", "message": "...", "stat_effects": {} }
                    pass # Keep next_node_id as None if no path
            else:
                # No LLM prompt, try to find a default single outgoing edge
                default_edge = next((edge for edge in story_graph.edges if edge.source == current_node.id), None)
                if default_edge:
                    next_node_id = default_edge.target
                    if default_edge.data.stat_effects:
                        for stat, val in default_edge.data.stat_effects.items():
                            updated_stats[stat] = updated_stats.get(stat, 0) + val
                else:
                    print(f"Warning: QUESTION_INPUT node {current_node.id} has no llm_processing_prompt and no outgoing edge.")

        elif current_node.type == "END":
            next_node_id = current_node.id # Stay on END node
            if current_node.data.ending_message_prompt:
                prompt_template = current_node.data.ending_message_prompt
                prompt = prompt_template.format(current_stats=updated_stats)
                final_message_override = await self._call_llm(prompt)
            else:
                final_message_override = current_node.data.text_content # Use default if no LLM prompt
        
        # Determine the actual next node object
        actual_next_node = self._find_node_by_id(story_graph, next_node_id) if next_node_id else None

        if not actual_next_node:
            # If no next node can be determined (e.g. dead end, or LLM failed to route)
            # Fallback: consider this game over, or stay on current node with a message
            # For now, let's assume game over if no valid next node from non-END node
            if current_node.type != "END":
                 print(f"Error: Could not determine next node from {current_node.id}. Ending game.")
                 # Create a pseudo-END response
                 return story_schema.GamePlayResponse(
                    next_node_id=current_node.id,
                    next_node_data=story_schema.GamePlayResponseNodeData(**current_node.data.model_dump()),
                    updated_stats=updated_stats,
                    is_game_over=True,
                    final_message="An unexpected error occurred, and the story cannot continue."
                )
            else: # Already at an END node, and it was processed above
                pass # final_message_override should be set

        # Prepare response data for the next node
        response_next_node_data_dict = actual_next_node.data.model_dump()
        if next_node_data_override: # If LLM provided new text for next node
            response_next_node_data_dict.update(next_node_data_override)
        
        response_next_node_data = story_schema.GamePlayResponseNodeData(**response_next_node_data_dict)

        is_game_over = actual_next_node.type == "END"
        
        final_msg_to_send = None
        if is_game_over:
            if final_message_override is not None:
                final_msg_to_send = final_message_override
            elif actual_next_node.data.text_content : # Fallback to node's own text if no LLM override
                final_msg_to_send = actual_next_node.data.text_content
            else:
                final_msg_to_send = "The story has concluded."
            # If END node text_content itself was meant to be an LLM prompt, it should have been in ending_message_prompt
            # For an END node, the text_content is the fallback if ending_message_prompt is not used or fails.

        return story_schema.GamePlayResponse(
            next_node_id=actual_next_node.id,
            next_node_data=response_next_node_data,
            updated_stats=updated_stats,
            is_game_over=is_game_over,
            final_message=final_msg_to_send
        )

# Instantiate if you want to use it as a singleton injected via Depends
# game_service_instance = GameService() 