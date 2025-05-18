// src/services/storyService.js (Mock Version)

// 초기 샘플 데이터 (StoryEditorPage의 initialNodes/initialEdges와 유사하게 구성)
// 이 데이터는 StoryEditorPage.jsx에서 직접 initialNodes, initialEdges로 사용됩니다.
// storyService에서는 이 데이터를 직접 참조하지 않고, 가짜 API 호출만 시뮬레이션합니다.

// 프론트엔드 React Flow 형식으로 변환하는 함수 (실제 백엔드 연동 시 사용)
const transformNodeForFrontend = (backendNode) => ({
  id: backendNode.id.toString(),
  type: 'custom',
  position: backendNode.position,
  data: {
    type: backendNode.type, 
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

// StoryEditorPage.jsx에서 가져온 샘플 데이터
const sampleNodes = [
  { id: '1', type: 'custom', data: { type: 'STORY', label: '스토리 시작', text_content: "모험이 시작됩니다. 깊고 어두운 숲 속에 당신은 홀로 서 있습니다...", characterName: "나레이터", imageUrl: "https://placehold.co/240x112/2D3748/E2E8F0?text=숲+속&font=sans", imageFile: null }, position: { x: 50, y: 150 } },
  { id: '2', type: 'custom', data: { type: 'QUESTION', label: '첫 번째 갈림길', text_content: "왼쪽의 좁은 길과 오른쪽의 넓은 길이 보입니다. 어느 쪽으로 가시겠습니까?", characterName: "", imageUrl: "https://placehold.co/240x112/4A5568/E2E8F0?text=갈림길&font=sans", imageFile: null }, position: { x: 400, y: 150 } },
  { id: '3', type: 'custom', data: { type: 'STORY', label: '왼쪽 길 결과', text_content: "왼쪽 길은 결국 막다른 절벽으로 이어졌다. 더 이상 나아갈 수 없다.", characterName: "", imageUrl: "https://placehold.co/240x112/718096/E2E8F0?text=절벽&font=sans", imageFile: null }, position: { x: 750, y: 50 } },
  { id: '4', type: 'custom', data: { type: 'QUESTION_INPUT', label: '오른쪽 길 질문', text_content: "오른쪽 길을 따라가니, 수수께끼를 내는 스핑크스를 만났다. '가장 강력한 마법은 무엇인가?'", characterName: "스핑크스", imageUrl: "https://placehold.co/240x112/A0AEC0/4A5568?text=스핑크스&font=sans", imageFile: null, inputPrompt:"답변을 속삭이세요..." }, position: { x: 750, y: 250 } },
  { id: '5', type: 'custom', data: { type: 'STORY', label: '수수께끼 답변 후', text_content: "당신의 답변에 따라 스핑크스의 반응이 달라질 것입니다...", characterName: "", imageUrl: "", imageFile: null }, position: { x: 1100, y: 250 } },
];

const sampleEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '숲으로 들어간다', type: 'smoothstep', markerEnd: { type: 'ArrowClosed' }, data: { stat_effects: null } },
  { id: 'e2-3', source: '2', target: '3', label: '좁은 길로 간다', type: 'smoothstep', markerEnd: { type: 'ArrowClosed' }, data: { stat_effects: {"지혜":1} } },
  { id: 'e2-4', source: '2', target: '4', label: '넓은 길로 간다', type: 'smoothstep', markerEnd: { type: 'ArrowClosed' }, data: { stat_effects: {"용기":1} } },
  { id: 'e4-5', source: '4', target: '5', label: '답변에 따라...', type: 'smoothstep', markerEnd: { type: 'ArrowClosed' }, data: { llm_routing_prompt: "사용자의 답변을 분석하여 이 경로로..." } },
];

export const storyService = {
  getStoryDetail: async (storyId) => {
    console.log(`[MockStoryService] 스토리 상세 정보 요청: ${storyId}`);
    return new Promise(resolve => setTimeout(() => {
      // 실제로는 StoryEditorPage의 initialNodes/Edges를 기반으로 스토리 정보를 구성해야 함
      resolve({ id: storyId, title: `스토리 ${storyId} (Mock)`, description: "가짜 설명입니다.", initial_stats: { "용기": 5, "지혜": 5 } });
    }, 200));
  },

  getMyStories: async () => {
    console.log("[MockStoryService] 내 스토리 목록 요청");
    return new Promise(resolve => setTimeout(() => {
      const mockStories = [
        { id: '1', title: '샘플 모험 이야기', description: '나만의 첫 번째 인터랙티브 스토리입니다.', last_updated: '2024-05-10', author: '테스트유저' },
        { id: '2', title: '미스터리 맨션 탈출', description: '단서를 찾아 맨션에서 탈출하세요.', last_updated: '2024-05-15', author: '테스트유저' },
        { id: 'new_story_template', title: '새 스토리 만들기', description: '새로운 인터랙티브 스토리를 시작합니다.', last_updated: '', author: '' }, // 새 스토리 템플릿
      ];
      resolve(mockStories);
    }, 400));
  },

  getNodes: async (storyId) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}의 노드 목록 요청`);
    return new Promise(resolve => setTimeout(() => {
      if (storyId === '1') {
        // StoryEditorPage의 initialNodes와 유사하게, React Flow가 요구하는 형식으로 반환
        // (이미 sampleNodes는 React Flow 형식에 맞춰져 있다고 가정)
        resolve(sampleNodes.map(node => ({...node, sourcePosition: 'right', targetPosition: 'left'})));
      } else {
        resolve([].map(transformNodeForFrontend)); 
      }
    }, 300));
  },

  saveNodes: async (storyId, nodesToSave) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}에 노드 저장 요청:`, nodesToSave);
    return new Promise(resolve => setTimeout(() => {
      console.log(`[MockStoryService] 노드 저장됨 (가짜).`);
      resolve({ success: true, count: nodesToSave.length });
    }, 500));
  },

  getEdges: async (storyId) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}의 엣지 목록 요청`);
    return new Promise(resolve => setTimeout(() => {
      if (storyId === '1') {
        resolve(sampleEdges.map(edge => ({...edge, markerEnd: { type: 'ArrowClosed' }}))); // markerEnd 타입을 대문자로 수정
      } else {
        resolve([].map(transformEdgeForFrontend));
      }
    }, 300));
  },

  saveEdges: async (storyId, edgesToSave) => {
    console.log(`[MockStoryService] 스토리 ID ${storyId}에 엣지 저장 요청:`, edgesToSave);
    return new Promise(resolve => setTimeout(() => {
      console.log(`[MockStoryService] 엣지 저장됨 (가짜).`);
      resolve({ success: true, count: edgesToSave.length });
    }, 500));
  },

  generateAiNodes: async (storyId, aiParams) => {
    console.log(`[MockStoryService] AI 노드 생성 요청 (스토리 ID: ${storyId}):`, aiParams);
    return new Promise(resolve => setTimeout(() => {
      alert("AI 노드 생성 기능은 아직 구현되지 않았습니다. (가짜 응답)");
      // 예시 반환 데이터 구조
      resolve({ 
        newNodes: [
          // { id: 'ai-node-1', type: 'STORY', data: {label: 'AI 생성 스토리 1', text_content: '...'}, position: {x:0,y:0}}
        ].map(transformNodeForFrontend), 
        newEdges: [
          // { id: 'e-ai-1', source: aiParams.sourceNodeId, target: 'ai-node-1', label: 'AI 선택지 1'}
        ].map(transformEdgeForFrontend)
      }); 
    }, 1000));
  }
};
