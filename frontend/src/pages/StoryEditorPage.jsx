// src/pages/StoryEditorPage.jsx
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import NodeEditSidebar from '../components/story/NodeEditSidebar';
import CustomNode from '../components/story/CustomNode'; 
import { storyService } from '../services/storyService'; 

const NODE_WIDTH = 256; 
const NODE_SPACING_X = 100;

const nodeTypes = { custom: CustomNode }; 

const initialNodes = [
  { id: '1', type: 'custom', data: { type: 'STORY', label: '스토리 시작', text_content: "모험이 시작됩니다. 깊고 어두운 숲 속에 당신은 홀로 서 있습니다...", characterName: "나레이터", imageUrl: "https://placehold.co/240x112/2D3748/E2E8F0?text=숲+속&font=sans", imageFile: null }, position: { x: 50, y: 150 }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '2', type: 'custom', data: { type: 'QUESTION', label: '첫 번째 갈림길', text_content: "왼쪽의 좁은 길과 오른쪽의 넓은 길이 보입니다. 어느 쪽으로 가시겠습니까?", characterName: "", imageUrl: "https://placehold.co/240x112/4A5568/E2E8F0?text=갈림길&font=sans", imageFile: null }, position: { x: 50 + NODE_WIDTH + NODE_SPACING_X, y: 150 }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '3', type: 'custom', data: { type: 'STORY', label: '왼쪽 길 결과', text_content: "왼쪽 길은 결국 막다른 절벽으로 이어졌다. 더 이상 나아갈 수 없다.", characterName: "", imageUrl: "https://placehold.co/240x112/718096/E2E8F0?text=절벽&font=sans", imageFile: null }, position: { x: 50 + (NODE_WIDTH + NODE_SPACING_X) * 2, y: 50 }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '4', type: 'custom', data: { type: 'QUESTION_INPUT', label: '오른쪽 길 질문', text_content: "오른쪽 길을 따라가니, 수수께끼를 내는 스핑크스를 만났다. '가장 강력한 마법은 무엇인가?'", characterName: "스핑크스", imageUrl: "https://placehold.co/240x112/A0AEC0/4A5568?text=스핑크스&font=sans", imageFile: null, inputPrompt:"답변을 속삭이세요..." }, position: { x: 50 + (NODE_WIDTH + NODE_SPACING_X) * 2, y: 250 }, sourcePosition: Position.Right, targetPosition: Position.Left },
  { id: '5', type: 'custom', data: { type: 'STORY', label: '수수께끼 답변 후', text_content: "당신의 답변에 따라 스핑크스의 반응이 달라질 것입니다...", characterName: "", imageUrl: "", imageFile: null }, position: { x: 50 + (NODE_WIDTH + NODE_SPACING_X) * 3, y: 250 }, sourcePosition: Position.Right, targetPosition: Position.Left },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '숲으로 들어간다', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, data: { stat_effects: null } },
  { id: 'e2-3', source: '2', target: '3', label: '좁은 길로 간다', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, data: { stat_effects: {"지혜":1} } },
  { id: 'e2-4', source: '2', target: '4', label: '넓은 길로 간다', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, data: { stat_effects: {"용기":1} } },
  { id: 'e4-5', source: '4', target: '5', label: '답변에 따라...', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, data: { llm_routing_prompt: "사용자의 답변을 분석하여 이 경로로..." } },
];

// (checkCycleWithNewEdge 함수는 이전과 동일하게 유지)
const checkCycleWithNewEdge = (sourceId, targetId, currentNodes, currentEdges) => {
  const tempEdgesForCheck = [...currentEdges, { source: sourceId, target: targetId, id: `temp-check-${sourceId}-${targetId}` }];
  const graph = {};
  currentNodes.forEach(node => { graph[node.id] = []; });
  tempEdgesForCheck.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = [];
    graph[edge.source].push(edge.target);
  });
  const visited = new Set();
  const recursionStack = new Set();
  function dfs(nodeId) {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    const neighbors = graph[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true; 
      }
    }
    recursionStack.delete(nodeId);
    return false;
  }
  const graphWithoutNewEdge = {};
  currentNodes.forEach(node => graphWithoutNewEdge[node.id] = []);
  currentEdges.forEach(edge => {
      if (!graphWithoutNewEdge[edge.source]) graphWithoutNewEdge[edge.source] = [];
      graphWithoutNewEdge[edge.source].push(edge.target);
  });
  function canReach(start, end, currentGraph) {
      const q = [start];
      const visitedInReach = new Set([start]);
      while(q.length > 0) {
          const curr = q.shift();
          if (curr === end) return true;
          (currentGraph[curr] || []).forEach(neighbor => {
              if (!visitedInReach.has(neighbor)) {
                  visitedInReach.add(neighbor);
                  q.push(neighbor);
              }
          });
      }
      return false;
  }
  if (canReach(targetId, sourceId, graphWithoutNewEdge)) {
      return true;
  }
  return dfs(sourceId);
};


const StoryEditorPage = forwardRef(({ setCurrentStoryTitle }, ref) => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null);
  // shakeEditor 상태는 직접 사용되지 않으므로, 단순 트리거용으로 변경하거나 관련 로직 재검토 필요.
  // 여기서는 우선 setShakeEditor를 직접 호출하는 대신, 다른 방식을 사용하도록 주석 처리.
  // const [shakeEditor, setShakeEditor] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const triggerShakeEffect = useCallback((message = "유효하지 않은 작업입니다!") => {
    // setShakeEditor(prev => prev + 1); // 이 부분은 shakeEditor 상태를 사용하지 않으므로 주석 처리 또는 다른 방식으로 대체
    // Framer Motion 등을 사용한 실제 흔들림 효과를 구현하거나, UI 피드백 방식을 통일할 수 있습니다.
    // 현재는 alert만 사용하므로 shakeEditor 상태가 불필요합니다.
    try { /* ... (알림음 로직) ... */ } catch(e) { console.warn("알림음 재생 실패:", e); }
    alert(`🚫 ${message}`);
  }, []); // 의존성 배열이 비어있음

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;
    if (connection.source === connection.target) {
      triggerShakeEffect("자기 자신에게 연결할 수 없습니다.");
      return false;
    }

    const outgoingEdgesFromSource = edges.filter(edge => edge.source === connection.source);
    // 노드 data 객체 내의 type (STORY, QUESTION 등)을 기준으로 검사
    if (sourceNode.data?.type === 'STORY' && outgoingEdgesFromSource.length >= 1) {
      triggerShakeEffect("'스토리' 타입 노드는 하나의 다음 선택지만 가질 수 있습니다.");
      return false;
    }
    if (sourceNode.data?.type === 'QUESTION' && outgoingEdgesFromSource.length >= 2) {
      triggerShakeEffect("'질문' 타입 노드는 최대 두 개의 다음 선택지만 가질 수 있습니다.");
      return false;
    }
    // QUESTION_INPUT 타입은 이제 엣지 개수 제한 없음
    
    if (checkCycleWithNewEdge(connection.source, connection.target, nodes, edges)) {
        triggerShakeEffect("이 연결은 이야기 흐름에 사이클을 만듭니다.");
        return false;
    }
    return true;
  }, [nodes, edges, triggerShakeEffect]);

  const onConnect = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const currentOutgoingCount = edges.filter(e => e.source === connection.source).length;
    const newEdge = { 
      ...connection, 
      id: `e${connection.source}-${connection.target}-${Date.now()}`,
      type: 'smoothstep', 
      markerEnd: { type: MarkerType.ArrowClosed },
      label: `선택지 ${currentOutgoingCount + 1}`, 
      data: { stat_effects: null, llm_routing_prompt: "" } 
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [nodes, edges, setEdges]);

  const onNodeClick = useCallback((event, node) => setSelectedNodeForEdit(node), []);
  const onPaneClick = useCallback(() => setSelectedNodeForEdit(null), []);

  useEffect(() => {
    if (storyId) {
      setIsLoading(true);
      Promise.all([
        storyService.getStoryDetail(storyId),
        storyService.getNodes(storyId),
        storyService.getEdges(storyId)
      ]).then(([storyDetail, fetchedNodes, fetchedEdges]) => {
        if (setCurrentStoryTitle && storyDetail) {
          setCurrentStoryTitle(storyDetail.title || `스토리 "${storyId}" 편집`);
        }
        // fetchedNodes와 fetchedEdges는 이미 storyService에서 transform 된 상태
        setNodes(fetchedNodes || []); 
        setEdges(fetchedEdges || []);
      }).catch(error => {
        console.error("스토리 데이터 로드 실패:", error);
        triggerShakeEffect("스토리 데이터를 불러오는 데 실패했습니다.");
        setNodes(initialNodes.map(n => ({...n, type:'custom'}))); // 오류 시 초기 샘플 사용
        setEdges(initialEdges);
        if (setCurrentStoryTitle) setCurrentStoryTitle(`스토리 "${storyId}" 편집 (오류)`);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      navigate('/');
    }
  }, [storyId, navigate, setCurrentStoryTitle, triggerShakeEffect]);

  const handleNodeDataChange = useCallback((nodeId, newDataFromSidebar, reactFlowNodeType) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { 
            ...node, 
            data: { 
              ...node.data, 
              ...newDataFromSidebar, // newDataFromSidebar에 게임 로직상 type (STORY, QUESTION 등)이 포함되어 있음
            },
            // React Flow의 최상위 type은 변경하지 않음 (항상 'custom')
          };
          
          const currentLogicType = newDataFromSidebar.type || node.data.type;
          const outgoing = edges.filter(e => e.source === nodeId);
          if (currentLogicType === 'STORY' && outgoing.length > 1) {
            triggerShakeEffect(`'스토리' 타입은 하나의 다음 노드만 가질 수 있습니다. 현재 ${outgoing.length}개의 연결이 있습니다.`);
          } else if (currentLogicType === 'QUESTION' && outgoing.length > 2) {
            triggerShakeEffect(`'질문' 타입은 최대 두 개의 다음 노드만 가질 수 있습니다. 현재 ${outgoing.length}개의 연결이 있습니다.`);
          }
          return updatedNode;
        }
        return node;
      })
    );
    setSelectedNodeForEdit(prev => 
        prev && prev.id === nodeId 
        ? {
            ...prev, 
            data: {...prev.data, ...newDataFromSidebar}, 
          } 
        : prev
    );
  }, [setNodes, edges, triggerShakeEffect]);

  const handleEdgeChangeFromSidebar = useCallback((edgeId, updatedProperties) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          const newEdge = { ...edge, ...updatedProperties };
          if (updatedProperties.data) {
            newEdge.data = { ...edge.data, ...updatedProperties.data };
          }
          if (updatedProperties.target && updatedProperties.target !== edge.target) {
            if (checkCycleWithNewEdge(newEdge.source, newEdge.target, nodes, eds.filter(e => e.id !== edgeId) )) {
                triggerShakeEffect("이 변경은 사이클을 생성합니다. 다른 노드를 선택해주세요.");
                return edge; 
            }
          }
          return newEdge;
        }
        return edge;
      })
    );
  }, [setEdges, nodes, triggerShakeEffect]);

  const handleCloseSidebar = useCallback(() => setSelectedNodeForEdit(null), []);

  const internalAddNode = useCallback(() => {
    const newNodeId = `node_${Date.now()}`;
    let newPosition;
    let sourceNodeForEdge = null;
    const currentSelectedNode = selectedNodeForEdit;

    // 자동 배치: 기존 노드들과 겹치지 않게 배치
    if (nodes.length > 0) {
      // x축으로 가장 오른쪽 + NODE_WIDTH + NODE_SPACING_X, y축은 아래로 50px씩 이동(순환)
      const maxX = Math.max(...nodes.map(n => n.position.x));
      const usedY = nodes.map(n => n.position.y);
      // y축은 50, 150, 250, 350 등으로 순환 배치
      const yCandidates = [50, 150, 250, 350, 450];
      let nextY = yCandidates.find(y => !usedY.includes(y));
      if (nextY === undefined) nextY = 50 + (nodes.length % yCandidates.length) * 100;
      newPosition = { x: maxX + NODE_WIDTH + NODE_SPACING_X, y: nextY };
    } else {
      newPosition = { x: 50, y: 150 };
    }

    if (currentSelectedNode) {
      const sNode = nodes.find(n => n.id === currentSelectedNode.id);
      if (sNode) {
        sourceNodeForEdge = sNode;
        // 선택된 노드 기준 오른쪽에 배치, y축은 자동 배치값 사용
        newPosition = { x: sNode.position.x + NODE_WIDTH + NODE_SPACING_X, y: newPosition.y };
      }
    }

    const newNode = {
      id: newNodeId, 
      type: 'custom',
      data: { 
        type: 'STORY', 
        label: `새 노드 ${newNodeId.substring(5,9)}`, 
        text_content: "", characterName: "", imageUrl: "", imageFile: null 
      },
      position: newPosition, sourcePosition: Position.Right, targetPosition: Position.Left,
    };
    setNodes((nds) => nds.concat(newNode));

    if (sourceNodeForEdge) {
      const connection = { source: sourceNodeForEdge.id, target: newNodeId, sourceHandle: null, targetHandle: null };
      if (isValidConnection(connection)) {
        const newEdgeId = `e${sourceNodeForEdge.id}-${newNodeId}-${Date.now()}`;
        const newEdge = {
          id: newEdgeId, source: sourceNodeForEdge.id, target: newNodeId,
          type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed },
          label: `선택지 ${edges.filter(e => e.source === sourceNodeForEdge.id).length + 1}`, 
          data: { stat_effects: null, llm_routing_prompt: "" }
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    }
  }, [nodes, edges, selectedNodeForEdit, setNodes, setEdges, isValidConnection]);

  const internalSave = useCallback(async () => {
    if (!storyId) return;
    setIsSaving(true);
    console.log(`[StoryEditorPage] 스토리 ID ${storyId} 저장 시도...`);
    
    const nodesToSave = nodes.map(node => ({
        id: node.id,
        type: node.data.type, 
        data: { 
            label: node.data.label,
            text_content: node.data.text_content,
            characterName: node.data.characterName,
            imageUrl: node.data.imageUrl, 
            inputPrompt: node.data.inputPrompt,
        },
        position: node.position,
    }));

    const edgesToSave = edges.map(edge => ({
        id: edge.id, source: edge.source, target: edge.target, label: edge.label,
        type: edge.type, data: edge.data, markerEnd: edge.markerEnd
    }));

    try {
      await Promise.all([
        storyService.saveNodes(storyId, nodesToSave),
        storyService.saveEdges(storyId, edgesToSave)
      ]);
      alert(`스토리 ID ${storyId} 저장 완료!`);
    } catch (error) {
      console.error("스토리 저장 실패:", error);
      triggerShakeEffect("스토리 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [storyId, nodes, edges]);

  const handleAiGenerate = useCallback(async (aiParams) => {
    console.log("[StoryEditorPage] AI 생성 요청 받음:", aiParams);
    setIsLoading(true);
    try {
      const { newNodes: aiGeneratedNodes, newEdges: aiGeneratedEdges } = await storyService.generateAiNodes(storyId, aiParams);
      // AI 생성 결과(노드, 엣지)를 현재 상태에 병합하는 로직 필요
      // ID 충돌 방지, 위치 조정, React Flow 형식으로 변환 등
      // 예시:
      // const latestNodeId = Math.max(0, ...nodes.map(n => parseInt(n.id.split('_')[1] || '0', 10)));
      // const formattedAiNodes = aiGeneratedNodes.map((n, i) => ({...transformNodeForFrontend(n), id: `ai_node_${latestNodeId + i + 1}`}));
      // const formattedAiEdges = aiGeneratedEdges.map(e => transformEdgeForFrontend(e)); // ID 매핑 필요
      // setNodes(prev => [...prev, ...formattedAiNodes]);
      // setEdges(prev => [...prev, ...formattedAiEdges]);
      alert(`AI 노드 생성 기능이 호출되었습니다. (구현 예정)`);
      console.log("AI 생성 결과 (가짜):", { aiGeneratedNodes, aiGeneratedEdges });
    } catch (error) {
      console.error("AI 노드 생성 실패:", error);
      triggerShakeEffect("AI 노드 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [storyId /*, nodes, edges, setNodes, setEdges */]);


  useImperativeHandle(ref, () => ({
    triggerAddNode: internalAddNode,
    triggerSave: internalSave,
    getSelectedNodeId: () => selectedNodeForEdit?.id,
  }));

  if (isLoading && nodes.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">스토리 에디터 로딩 중...</div>;
  }

  return (
    <div className="w-full h-full flex">
      <motion.div 
        className="flex-grow bg-white"
        animate={{ x: selectedNodeForEdit ? [0, -3, 3, -3, 3, -2, 2, 0] : 0 }}
        transition={{ duration: 0.3 }}
      >
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} isValidConnection={isValidConnection}
          onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView className="story-editor-flow"
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Controls />
          <Background color="#f0f0f0" gap={24} size={1.5} />
        </ReactFlow>
      </motion.div>
      {selectedNodeForEdit && (
        <NodeEditSidebar
          key={selectedNodeForEdit.id}
          selectedNode={selectedNodeForEdit}
          allNodes={nodes} allEdges={edges}
          onNodeDataChange={handleNodeDataChange}
          onEdgeChange={handleEdgeChangeFromSidebar}
          onClose={handleCloseSidebar}
          isCycleCallback={(sourceId, targetId, currentEdgesForCheck) => checkCycleWithNewEdge(sourceId, targetId, nodes, currentEdgesForCheck || edges)}
          onAiGenerate={handleAiGenerate}
        />
      )}
      {isSaving && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-xl p-4 bg-gray-700 rounded-md">저장 중...</div>
        </div>
      )}
    </div>
  );
});
StoryEditorPage.displayName = 'StoryEditorPage';

const StoryEditorPageWithProvider = forwardRef((props, ref) => {
  return (
    <ReactFlowProvider>
      <StoryEditorPage {...props} ref={ref} />
    </ReactFlowProvider>
  );
});
StoryEditorPageWithProvider.displayName = 'StoryEditorPageWithProvider';

export default StoryEditorPageWithProvider;
