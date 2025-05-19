// src/services/storyService.js
// ... (imports and other functions) ...

// 백엔드로 보낼 때 React Flow 관련 속성 제거 (필요한 경우)
const transformNodeForBackend = (frontendNode) => {
  // frontendNode is a React Flow node object
  // These properties are part of frontendNode but not used directly in the backend payload construction below.
  // const {
  //   sourcePosition, 
  //   targetPosition, 
  //   selected, 
  //   dragging, 
  //   width, 
  //   height,
  //   type: reactFlowNodeType // rename reactflow's 'type' (e.g., 'custom') to avoid clash
  // } = frontendNode;

  const nodeDataPayload = frontendNode.data || {};

  return {
    id: frontendNode.id.toString(),
    type: nodeDataPayload.type || 'STORY', 
    position: frontendNode.position,
    data: { 
      label: nodeDataPayload.label || (nodeDataPayload.type === 'STORY_START' ? '시작' : '새 노드'), 
      text_content: nodeDataPayload.text_content || "", 
      characterName: nodeDataPayload.characterName || "", 
      inputPrompt: nodeDataPayload.inputPrompt || "",
      imageUrl: nodeDataPayload.imageUrl || null,
    },
  };
};

// ... (transformEdgeForBackend and other service functions) ... 