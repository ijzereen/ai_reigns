// src/services/storyService.js
// import {AuthContext} from "../contexts/AuthContext"; // Not used directly here

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get the auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken'); // Changed from 'token' to 'authToken' to match AuthContext
};

// 프론트엔드 React Flow 형식으로 변환하는 함수들 (이전과 동일하게 유지 또는 필요시 수정)
const transformNodeForFrontend = (backendNode) => ({
  id: backendNode.id.toString(), // Ensure ID is string for React Flow
  type: 'custom', // 프론트엔드 전용 타입
  position: backendNode.position,
  data: { // 백엔드 data 필드를 그대로 사용하거나, 프론트엔드 필요에 맞게 매핑
    ...backendNode.data,
    // label: backendNode.data.label, // 이미 포함되어 있을 것
    // text_content: backendNode.data.text_content, // 이미 포함
  },
  sourcePosition: 'right', // 프론트엔드 React Flow 표시용
  targetPosition: 'left',  // 프론트엔드 React Flow 표시용
});

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
  const { sourcePosition, targetPosition, ...restOfNode } = frontendNode;
  // type: 'custom'도 백엔드에서는 실제 노드 타입 (STORY, QUESTION 등)으로 변환 필요
  // 현재는 백엔드 graph_json이 프론트와 거의 동일한 구조를 기대하므로, data.type을 사용.
  return {
      ...restOfNode,
      data: frontendNode.data // data 필드는 그대로 전달 (내부에 type: STORY 등 포함)
  };
};

const transformEdgeForBackend = (frontendEdge) => {
    // markerEnd.type을 소문자로 변경해야 할 수도 있음 (백엔드 스키마 확인 필요)
    // 현재 백엔드는 대문자 ArrowClosed를 기대하지 않음 (API Spec v0.4 edge 참조)
    // const markerEnd = frontendEdge.markerEnd ? 
    //     { ...frontendEdge.markerEnd, type: (frontendEdge.markerEnd.type || 'arrowclosed').toLowerCase() } : 
    //     { type: 'arrowclosed' }; 
    // 백엔드 Edge 스키마는 markerEnd: { "type": "ArrowClosed" }를 따르므로 변환 불필요.
  return frontendEdge; // 특별한 변환 없이 전달
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
    const storyDetail = await response.json(); // { id, title, ..., graph_json: { nodes, edges } }
    
    // 백엔드에서 받은 graph_json의 nodes와 edges를 프론트엔드 React Flow 형식으로 변환
    const transformedNodes = (storyDetail.graph_json?.nodes || []).map(transformNodeForFrontend);
    const transformedEdges = (storyDetail.graph_json?.edges || []).map(transformEdgeForFrontend);

    return {
      ...storyDetail, // title, description 등 포함
      nodes: transformedNodes, // React Flow용 노드
      edges: transformedEdges, // React Flow용 엣지
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '게임 진행에 실패했습니다.');
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
