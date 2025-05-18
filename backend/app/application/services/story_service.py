// src/services/storyService.js (Mock Version)

// 초기 샘플 데이터 (StoryEditorPage의 initialNodes/initialEdges와 유사하게 구성)
const sampleStoryId = "1";
const mockStoryDetails = {
  [sampleStoryId]: { id: sampleStoryId, title: "마법사의 탑 모험 (Mock)", description: "가짜 데이터로 불러온 설명입니다.", initial_stats: { "용기": 7, "지혜": 3, "마력": 0, "금화": 5 } }
};
const mockNodesData = {
  [sampleStoryId]: [
    { id: '1', type: 'STORY', data: { label: '스토리 시작', text_content: "모험이 시작됩니다...", characterName: "나레이터", imageUrl: "https://placehold.co/240x112/2D3748/E2E8F0?text=숲+속&font=sans" }, position: { x: 50, y: 150 } },
    { id: '2', type: 'QUESTION', data: { label: '첫 번째 갈림길', text_content: "왼쪽으로 갈까, 오른쪽으로 갈까?", imageUrl: "https://placehold.co/240x112/4A5568/E2E8F0?text=갈림길&font=sans" }, position: { x: 370, y: 150 } },
    { id: '3', type: 'STORY', data: { label: '왼쪽 길 결과', text_content: "왼쪽 길은 막다른 절벽.", characterName: "", imageUrl: "https://placehold.co/240x112/718096/E2E8F0?text=절벽&font=sans" }, position: { x: 690, y: 50 } },
    { id: '4', type: 'QUESTION_INPUT', data: { label: '오른쪽 길 질문', text_content: "수수께끼: 가장 강력한 마법은?", characterName: "스핑크스", inputPrompt:"답변..." }, position: { x: 690, y: 250 } },
  ]
};
const mockEdgesData = {
  [sampleStoryId]: [
    { id: 'e1-2', source: '1', target: '2', label: '숲으로', type: 'smoothstep', data: {}, markerEnd: { type: 'arrowclosed' } },
    { id: 'e2-3', source: '2', target: '3', label: '왼쪽', type: 'smoothstep', data: { stat_effects: [{"statName":"지혜","change":1}] }, markerEnd: { type: 'arrowclosed' } },
    { id: 'e2-4', source: '2', target: '4', label: '오른쪽', type: 'smoothstep', data: { stat_effects: [{"statName":"용기","change":1}] }, markerEnd: { type: 'arrowclosed' } },
  ]
};

// 프론트엔드 React Flow 형식으로 변환하는 함수 (백엔드 연동 시에는 storyService에서 사용)
const transformNodeForFrontend = (backendNode) => ({
  id: backendNode.id.toString(),
  type: 'custom',
  position: backendNode.position,
  data: {
    type: backendNode.type, // STORY, QUESTION 등 게임 로직상 타입
    label: backendNode.data.label,
    text_content: backendNode.data.text_content,
    characterName: backendNode.data.characterName,
    imageUrl: backendNode.data.imageUrl,
    inputPrompt: backendNode.data.inputPrompt,
    imageFile: null,
  },
});

const transformEdgeForFrontend = (backendEdge) => ({
    id: backendEdge.id.toString(),
    source: backendEdge.source.toString(),
    target: backendEdge.target.toString(),
    label: backendEdge.label,
    type: backendEdge.type || 'smoothstep',
    markerEnd: backendEdge.markerEnd || { type: 'arrowclosed' },
    data: backendEdge.data || { stat_effects: null, llm_routing_prompt: "" },
});


export const storyService = {
  getStoryDetail: async (storyId) => {
    console.log(`[MockStoryService] 스토리 상세 정보 요청: ${storyId}`);
    return new Promise(resolve => setTimeout(() => {
      resolve(mockStoryDetails[storyId] || { id: storyId, title: `스토리 ${storyId} (Mock)`, description: "설명 없음", initial_stats: {} });
    }, 200));
  },

  getNodes: async (storyId) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}의 노드 목록 요청`);
    return new Promise(resolve => setTimeout(() => {
      const nodesToReturn = (mockNodesData[storyId] || []).map(transformNodeForFrontend);
      resolve(nodesToReturn); 
    }, 300));
  },

  saveNodes: async (storyId, nodesToSave) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}에 노드 저장 요청:`, nodesToSave);
    return new Promise(resolve => setTimeout(() => {
      // 목업에서는 실제 저장을 시뮬레이션하지 않고 콘솔 로그만 남김
      // mockNodesData[storyId] = nodesToSave; // 실제 목 데이터 업데이트는 필요시
      console.log(`[MockStoryService] 노드 저장됨 (가짜).`);
      resolve({ success: true, count: nodesToSave.length });
    }, 500));
  },

  getEdges: async (storyId) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}의 엣지 목록 요청`);
    return new Promise(resolve => setTimeout(() => {
      const edgesToReturn = (mockEdgesData[storyId] || []).map(transformEdgeForFrontend);
      resolve(edgesToReturn);
    }, 300));
  },

  saveEdges: async (storyId, edgesToSave) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}에 엣지 저장 요청:`, edgesToSave);
    return new Promise(resolve => setTimeout(() => {
      // mockEdgesData[storyId] = edgesToSave;
      console.log(`[MockStoryService] 엣지 저장됨 (가짜).`);
      resolve({ success: true, count: edgesToSave.length });
    }, 500));
  },

  generateAiNodes: async (storyId, aiParams) => {
    console.log(`[MockStoryService] AI 노드 생성 요청 (스토리 ID: ${storyId}):`, aiParams);
    return new Promise(resolve => setTimeout(() => {
      alert("AI 노드 생성 기능은 아직 구현되지 않았습니다. (가짜 응답)");
      // 예시로 간단한 노드와 엣지를 반환할 수 있음
      const sourceNode = mockNodesData[storyId]?.find(n => n.id === aiParams.sourceNodeId);
      const newNodes = [];
      const newEdges = [];
      if (sourceNode) {
        for (let i = 0; i < (aiParams.generationOptions.branches || 1); i++) {
          const newNodeId = `ai_node_${Date.now()}_${i}`;
          newNodes.push({
            id: newNodeId,
            type: aiParams.generationOptions.nodeType || 'STORY', // 요청된 타입 또는 기본값
            data: { label: `AI 생성 노드 ${i+1}`, text_content: `${aiParams.generationOptions.prompt || 'AI가 생성한 내용...'} (${i+1})` },
            position: { x: (sourceNode.position.x || 0) + 300, y: (sourceNode.position.y || 0) + i * 100 }
          });
          newEdges.push({
            id: `e${aiParams.sourceNodeId}-${newNodeId}`,
            source: aiParams.sourceNodeId,
            target: newNodeId,
            label: `AI 선택 ${i+1}`
          });
        }
      }
      resolve({ newNodes: newNodes.map(transformNodeForFrontend), newEdges: newEdges.map(transformEdgeForFrontend) }); 
    }, 1000));
  }
};
