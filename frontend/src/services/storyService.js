// src/services/storyService.js
// import {AuthContext} from "../contexts/AuthContext"; // Not used directly here

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get the auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken'); // Changed from 'token' to 'authToken' to match AuthContext
};

// 프론트엔드 React Flow 형식으로 변환하는 함수들 (이전과 동일하게 유지 또는 필요시 수정)
export const transformNodeForFrontend = (backendNode) => {
  if (!backendNode || typeof backendNode.id === 'undefined') {
    // Handle cases where backendNode is null, undefined, or doesn't have an id.
    // This might happen if the backend response for next_node_data is not as expected.
    console.error("transformNodeForFrontend received invalid backendNode:", backendNode);
    // Return a default/error node structure or null, depending on how GamePlayerPage handles it.
    // For now, returning null might be caught by GamePlayerPage to show an error.
    return null; 
  }
  return {
    id: backendNode.id.toString(), // Ensure ID is string for React Flow
    type: 'custom', // For React Flow to use our CustomNode component
    position: backendNode.position,
    data: { 
      ...backendNode.data, // Spread existing data from backendNode.data (like label, text_content)
      type: backendNode.type, // IMPORTANT: Add the game logic type from backendNode.type
    },
    sourcePosition: 'right', // 프론트엔드 React Flow 표시용
    targetPosition: 'left',  // 프론트엔드 React Flow 표시용
  };
};

const transformEdgeForFrontend = (backendEdge) => ({
  id: backendEdge.id.toString(),
  source: backendEdge.source.toString(),
  target: backendEdge.target.toString(),
  label: backendEdge.label,
  type: backendEdge.type || 'smoothstep',
  markerEnd: backendEdge.markerEnd || { type: 'ArrowClosed' }, // Ensure type is capitalized for RF
  data: backendEdge.data || { stat_effects: null },
});

// 백엔드로 보낼 때 React Flow 관련 속성 제거 (필요한 경우)
const transformNodeForBackend = (frontendNode) => {
  // frontendNode is a React Flow node object
  const {
    // Fields to exclude from the top-level of the backend node object
    sourcePosition, 
    targetPosition, 
    selected, 
    dragging, 
    width, 
    height,
    type: reactFlowNodeType // rename reactflow's 'type' (e.g., 'custom') to avoid clash
  } = frontendNode;

  const nodeDataPayload = frontendNode.data || {};

  return {
    id: frontendNode.id.toString(),
    type: nodeDataPayload.type || 'STORY', // Ensure type always has a value, default to STORY if undefined
    position: frontendNode.position,
    data: { // Construct the data payload for the backend
      label: nodeDataPayload.label || (nodeDataPayload.type === 'STORY_START' ? '시작' : '새 노드'), // Ensure label is not empty; provide a default
      // Backend expects string, even if empty, for these fields based on the 422 error for text_content.
      text_content: nodeDataPayload.text_content || "", 
      characterName: nodeDataPayload.characterName || "", 
      inputPrompt: nodeDataPayload.inputPrompt || "",
      // imageUrl can likely be null if not provided.
      imageUrl: nodeDataPayload.imageUrl || null,
    },
  };
};

const transformEdgeForBackend = (frontendEdge) => {
  // frontendEdge is a React Flow edge object.
  // We need to extract only the data relevant for the backend.
  const backendEdgePayload = {
    id: frontendEdge.id.toString(),
    source: frontendEdge.source.toString(),
    target: frontendEdge.target.toString(),
    label: frontendEdge.label || '', // Ensure label is a string, even if empty
    // markerEnd is primarily for React Flow rendering. Omit unless backend explicitly requires and handles it.
    // markerEnd: frontendEdge.markerEnd, 

    // Only include specific data fields expected by the backend EdgeData schema.
    data: {
      // Initialize with defaults or nulls as per backend schema expectations.
      stat_effects: null,
      llm_routing_prompt: "", 
    },
  };

  // Populate data fields if they exist in frontendEdge.data
  if (frontendEdge.data) {
    if (typeof frontendEdge.data.stat_effects !== 'undefined') {
      backendEdgePayload.data.stat_effects = Array.isArray(frontendEdge.data.stat_effects) ? frontendEdge.data.stat_effects : null;
    }
    if (typeof frontendEdge.data.llm_routing_prompt === 'string') {
      backendEdgePayload.data.llm_routing_prompt = frontendEdge.data.llm_routing_prompt;
    }
    // Add any other known/expected fields from frontendEdge.data to backendEdgePayload.data here
  }

  return backendEdgePayload;
};


export const storyService = {
  // 스토리 목록 가져오기
  getMyStories: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stories/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '내 스토리 목록을 불러오는 데 실패했습니다.');
    }
    // 백엔드 응답: [ { id, title, description, last_updated, author_username } ]
    // 프론트 StoryListPage는 initial_stats 등도 기대할 수 있으나, 목록에서는 불필요할 수 있음.
    // 필요시 StoryBase 스키마에 graph_json의 일부(initial_stats)를 포함하도록 백엔드 수정 고려.
    return response.json(); 
  },

  // 새 스토리 생성 (초기 STORY_START 노드 포함된 graph_json 반환)
  createStory: async (newStoryData) => { // { title, description }
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newStoryData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '새 스토리 생성에 실패했습니다.');
    }
    const createdStory = await response.json(); // { id, title, ..., graph_json: { nodes, edges } }
    // 백엔드가 반환한 graph_json 내 노드/엣지를 프론트엔드 형식으로 변환할 필요 없음
    // StoryEditorPage는 getStoryDetail을 통해 전체 graph_json을 다시 로드하므로, 여기서는 id만 중요.
    return { id: createdStory.id, title: createdStory.title, description: createdStory.description }; // StoryListPage용 반환
  },

  // 스토리 상세 정보 및 전체 그래프 가져오기 (에디터용)
  getStoryDetail: async (storyId) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '스토리 상세 정보를 불러오는 데 실패했습니다.');
    }
    const storyDetail = await response.json(); // { id, title, ..., graph_json: { nodes, edges, initial_stats } }
    
    const transformedNodes = (storyDetail.graph_json?.nodes || []).map(transformNodeForFrontend);
    const transformedEdges = (storyDetail.graph_json?.edges || []).map(transformEdgeForFrontend);

    return {
      ...storyDetail, // title, description, etc. are at the top level
      initial_stats: storyDetail.graph_json?.initial_stats || {},
      nodes: transformedNodes, // React Flow용 노드
      edges: transformedEdges, // React Flow용 엣지
      // graph_json is still available if needed, but nodes/edges/initial_stats are now top-level for convenience
    };
  },

  // 스토리 업데이트 (메타데이터 및 전체 그래프 저장)
  saveStoryGraph: async (storyId, title, description, nodesToSave, edgesToSave) => {
    const token = getAuthToken();
    
    // 프론트엔드 노드/엣지를 백엔드 형식으로 변환 (현재는 거의 동일하나, type:'custom' 등 정리)
    const backendNodes = nodesToSave.map(transformNodeForBackend);
    const backendEdges = edgesToSave.map(transformEdgeForBackend);

    const payload = {
      title,
      description,
      graph_json: {
        nodes: backendNodes,
        edges: backendEdges,
      },
    };

    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '스토리 저장에 실패했습니다.');
    }
    return response.json(); // 업데이트된 스토리 전체 반환
  },

  // AI 기반 노드/엣지 생성 요청
  generateAiElements: async (storyId, currentGraph, generationParams) => {
    const token = getAuthToken();
    // currentGraph (nodes, edges)를 백엔드가 요구하는 StoryGraph 형식으로 변환
    const backendGraphJson = {
        nodes: currentGraph.nodes.map(transformNodeForBackend),
        edges: currentGraph.edges.map(transformEdgeForBackend)
    };

    const payload = {
        current_graph_json: backendGraphJson,
        source_node_id: generationParams.sourceNodeId, 
        generation_prompt: generationParams.prompt,
        num_choices_to_generate: generationParams.numChoices || 2
    };

    const response = await fetch(`${API_BASE_URL}/stories/${storyId}/ai/generate-elements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'AI 요소 생성에 실패했습니다.');
    }
    const result = await response.json(); // { updated_graph_json: { nodes, edges } }
    
    // 백엔드에서 받은 updated_graph_json을 프론트엔드 React Flow 형식으로 변환
    return {
        newNodes: (result.updated_graph_json?.nodes || []).map(transformNodeForFrontend),
        newEdges: (result.updated_graph_json?.edges || []).map(transformEdgeForFrontend),
    };
  },

  // 게임 진행 (GamePlayerPage용)
  proceedGame: async (storyId, current_node_id, chosen_edge_id, user_input, current_stats) => {
    const token = getAuthToken();
    const payload = {
      current_node_id,
      chosen_edge_id,
      user_input,
      current_stats
    };

    const response = await fetch(`${API_BASE_URL}/play/${storyId}/proceed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = '게임 진행에 실패했습니다.';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || `Error ${response.status}: ${response.statusText}`; 
      } catch (e) {
        // If response is not JSON, use status text or a generic message
        errorDetail = `Error ${response.status}: ${response.statusText}. Server response was not valid JSON.`;
      }
      throw new Error(errorDetail);
    }
    return response.json(); // { next_node_id, next_node_data, updated_stats, is_game_over, final_message }
  },
  
  // 파일 업로드 (StoryEditorPage의 NodeEditSidebar 등에서 사용)
  uploadImage: async (imageFile) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/files/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 'Content-Type': 'multipart/form-data'는 브라우저가 FormData와 함께 자동 설정
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '이미지 업로드에 실패했습니다.');
    }
    return response.json(); // { file_id, file_path, file_name, content_type, size_bytes }
  }

};
