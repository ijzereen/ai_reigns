// src/pages/StoryEditorPage.jsx
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
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
import { useDebouncedCallback } from 'use-debounce';

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

// Auto-save status type
const AUTO_SAVE_STATUS = {
  IDLE: '마지막 저장: কিছুক্ষণ আগে', // Placeholder, will be dynamic
  SAVING: '저장 중...',
  SUCCESS: '모든 변경 사항이 저장되었습니다.',
  ERROR: '자동 저장 실패.',
};

const StoryEditorPage = forwardRef(({ setCurrentStoryTitle }, ref) => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState(AUTO_SAVE_STATUS.IDLE);
  const [lastSaved, setLastSaved] = useState(new Date());
  const isInitialLoadDone = useRef(false);
  const editorRef = useRef(null); // To get editor's height for sidebar calculation
  const reactFlowWrapper = useRef(null); // Ref for ReactFlow viewport calculations
  const [reactFlowInstance, setReactFlowInstance] = useState(null); // Store instance

  const triggerShakeEffect = useCallback((message = "유효하지 않은 작업입니다!") => {
    try { /* ... (알림음 로직) ... */ } catch(e) { console.warn("알림음 재생 실패:", e); }
    alert(`🚫 ${message}`);
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges]);
  
  const onConnect = useCallback(
    (params) => {
      if (checkCycleWithNewEdge(params.source, params.target, nodes, edges)) {
        triggerShakeEffect("순환 구조는 허용되지 않습니다. 다른 노드를 선택해주세요.");
        return;
      }
      const newEdge = { ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#60A5FA' }, animated: false, style: { strokeWidth: 1.5, stroke: '#60A5FA'} };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edges, nodes, triggerShakeEffect]
  );

  const isValidConnection = useCallback(
    (connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      if (!sourceNode || !targetNode) return false;
      if (sourceNode.id === targetNode.id) return false;
      const sType = sourceNode.data.type;
      const existingEdgesFromSource = edges.filter(edge => edge.source === sourceNode.id);
      if (sType === 'STORY' && existingEdgesFromSource.length >= 1) return false;
      if (sType === 'QUESTION' && existingEdgesFromSource.length >= 2) return false;
      if (targetNode.data.type === 'STORY_START') return false;
      return !checkCycleWithNewEdge(connection.source, connection.target, nodes, edges);
    },
    [nodes, edges] 
  );
  
  const internalSave = useCallback(async (isAutoSave = false) => {
    if (!storyId) {
      console.error("스토리 ID가 없습니다. 저장할 수 없습니다.");
      if (isAutoSave) setAutoSaveStatus(AUTO_SAVE_STATUS.ERROR);
      else alert("스토리 ID가 없습니다. 저장할 수 없습니다.");
      return;
    }
    if (!isAutoSave) { // Manual save (not used now) or initial save could still set global saving
      // setIsSaving(true); 
    }
    setAutoSaveStatus(AUTO_SAVE_STATUS.SAVING);

    try {
      await storyService.saveStoryGraph(storyId, storyTitle, storyDescription, nodes, edges);
      setLastSaved(new Date());
      setAutoSaveStatus(AUTO_SAVE_STATUS.SUCCESS);
      if (!isAutoSave) {
        // alert("스토리가 성공적으로 저장되었습니다."); // No alert for auto-save
      }
    } catch (error) {
      console.error("스토리 저장 중 오류 발생:", error);
      setAutoSaveStatus(AUTO_SAVE_STATUS.ERROR);
      if (!isAutoSave) {
        triggerShakeEffect(`스토리 저장 중 오류가 발생했습니다: ${error.message}`);
      }
    } finally {
      if (!isAutoSave) {
        // setIsSaving(false);
      }
      // For auto-save, status will change, no need to reset to IDLE immediately.
      // It will go to SUCCESS or ERROR.
    }
  }, [storyId, storyTitle, storyDescription, nodes, edges, triggerShakeEffect]);

  // Debounced save function for auto-save
  const debouncedAutoSave = useDebouncedCallback(internalSave, 2000); // 2 seconds debounce

  useEffect(() => {
    if (storyId) {
      setIsLoading(true);
      isInitialLoadDone.current = false; // Reset before load
      storyService.getStoryDetail(storyId)
        .then((storyDetail) => {
          if (storyDetail) {
            const title = storyDetail.title || `스토리 "${storyId}" 편집`;
            const description = storyDetail.description || '';
            if (setCurrentStoryTitle) setCurrentStoryTitle(title);
            setStoryTitle(title);
            setStoryDescription(description);
            setNodes(storyDetail.nodes || []);
            setEdges(storyDetail.edges || []);
            setLastSaved(new Date()); // Set initial "last saved" time
            setAutoSaveStatus(prev => prev === AUTO_SAVE_STATUS.IDLE || prev === AUTO_SAVE_STATUS.SUCCESS ? `마지막 저장: ${new Date().toLocaleTimeString()}`: prev);
          } else {
            // Handle case where storyDetail might be null/undefined if API behaves unexpectedly
            const defaultTitle = `스토리 "${storyId}" 편집 (로드 실패)`;
            if (setCurrentStoryTitle) {
                setCurrentStoryTitle(defaultTitle);
            }
            setStoryTitle(defaultTitle);
            setStoryDescription('스토리 설명을 불러오는 데 실패했습니다.');
            setNodes(initialNodes.map(n => ({...n, type:'custom'})));
            setEdges(initialEdges);
          }
        })
        .catch(error => {
          console.error("스토리 데이터 로드 실패:", error);
          triggerShakeEffect("스토리 데이터를 불러오는 데 실패했습니다.");
          const errorTitle = `스토리 "${storyId}" 편집 (오류)`;
          if (setCurrentStoryTitle) {
            setCurrentStoryTitle(errorTitle);
          }
          setStoryTitle(errorTitle);
          setStoryDescription('스토리 설명을 불러오는 데 오류가 발생했습니다.');
          setNodes(initialNodes.map(n => ({...n, type:'custom'}))); // 오류 시 초기 샘플 사용
          setEdges(initialEdges);
        })
        .finally(() => {
          setIsLoading(false);
          isInitialLoadDone.current = true; // Mark initial load as done
          // Trigger an initial save if needed, or rely on first change
        });
    } else {
      navigate('/');
    }
  }, [storyId, navigate, setCurrentStoryTitle, triggerShakeEffect]);
  
  // Effect for auto-saving when relevant data changes
  useEffect(() => {
    if (!isInitialLoadDone.current || isLoading) { // Don't auto-save during initial load or if still loading
      return;
    }
    // Trigger auto-save, pass true to indicate it's an auto-save
    debouncedAutoSave(true); 
  }, [nodes, edges, storyTitle, storyDescription, debouncedAutoSave, isLoading]);

  // Update "Last saved" message for IDLE/SUCCESS status
  useEffect(() => {
    let intervalId;
    if (autoSaveStatus === AUTO_SAVE_STATUS.SUCCESS || autoSaveStatus.startsWith("마지막 저장:")) {
      const updateDisplay = () => {
        const now = new Date();
        const diffSeconds = Math.round((now - lastSaved) / 1000);
        if (diffSeconds < 5) {
          setAutoSaveStatus("방금 저장됨");
        } else if (diffSeconds < 60) {
          setAutoSaveStatus(`마지막 저장: ${diffSeconds}초 전`);
        } else {
          setAutoSaveStatus(`마지막 저장: ${lastSaved.toLocaleTimeString()}`);
        }
      };
      updateDisplay(); // Initial update
      intervalId = setInterval(updateDisplay, 5000); // Update every 5 seconds
    }
    return () => clearInterval(intervalId);
  }, [autoSaveStatus, lastSaved]);

  const handleNodeDataChange = useCallback((nodeId, newData, oldNodeType) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: { ...node.data, ...newData },
          };
          // If node type changed from a type that clears edges to one that doesn't, or vice-versa
          if (newData.type !== oldNodeType) {
            // Example: if changing from QUESTION (max 2 edges) to STORY (max 1 edge)
            // This logic might need to be more sophisticated based on specific rules
            const outgoing = edges.filter(e => e.source === nodeId);
            if ((oldNodeType === 'QUESTION' && newData.type === 'STORY' && outgoing.length > 1) || 
                (oldNodeType === 'STORY' && newData.type === 'QUESTION' && outgoing.length > 2) ){
                // Potentially clear edges or alert user
                // For now, just updating node type
            }
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
            data: {...prev.data, ...newData}, 
          } 
        : prev
    );
  }, [setNodes, edges, triggerShakeEffect]);

  const outgoingEdges = (nodeId) => edges.filter(edge => edge.source === nodeId);

  const handleEdgeChange = useCallback((edgeId, updatedData) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, ...updatedData, data: { ...edge.data, ...updatedData.data } };
        }
        return edge;
      })
    );
  }, [setEdges]);

  const isCycle = useCallback((source, target, currentEdges) => {
    return checkCycleWithNewEdge(source, target, nodes, currentEdges || edges);
  }, [nodes, edges]);

  const handleAiGenerationForNode = useCallback(async (params) => {
    console.log("AI Generation for node (StoryEditorPage):", params);
    setIsLoading(true);
    try {
      const { newNodes: aiGeneratedNodes, newEdges: aiGeneratedEdges } = await storyService.generateAiNodes(storyId, params);
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

  const internalAddNode = useCallback(() => {
    const newNodeId = `node_${Date.now()}`;
    let position = { x: 100, y: 100 }; // Default position

    if (reactFlowInstance) {
      // Try to place it in the center of the current viewport
      const viewport = reactFlowInstance.getViewport();
      position = reactFlowInstance.project({
        x: viewport.x + (reactFlowWrapper.current.clientWidth / 2) - (NODE_WIDTH / 2), // NODE_WIDTH is an assumed constant for node width
        y: viewport.y + (reactFlowWrapper.current.clientHeight / 2) - 50, // Assuming default node height around 100
      });
    } else if (nodes.length > 0) {
      // Fallback: place it to the right of the rightmost node
      const rightmostNode = nodes.reduce((prev, current) => (prev.position.x > current.position.x) ? prev : current);
      position = {
        x: rightmostNode.position.x + NODE_WIDTH + NODE_SPACING_X, // NODE_SPACING_X is an assumed constant
        y: rightmostNode.position.y,
      };
    }

    const newNode = {
      id: newNodeId,
      type: 'custom', // Your custom node type
      data: {
        type: 'STORY', // Default game logic type
        label: `새 노드 ${newNodeId.substring(5, 9)}`,
        text_content: "새로운 이야기 조각입니다.",
        characterName: "",
        imageUrl: "",
        imageFile: null,
      },
      position,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };

    setNodes((nds) => nds.concat(newNode));
    // Optionally select the new node for editing:
    // setTimeout(() => setSelectedNodeForEdit(newNode), 0); // Delay to ensure node is rendered
  }, [nodes, reactFlowInstance, setNodes]);

  useImperativeHandle(ref, () => ({
    triggerAddNode: internalAddNode, // Changed from handleAiGenerationForNode
    triggerSave: () => internalSave(false),
    getSelectedNodeId: () => selectedNodeForEdit?.id,
  }), [internalSave, selectedNodeForEdit, internalAddNode]);

  if (isLoading && nodes.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">스토리 에디터 로딩 중...</div>;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      {/* Top Bar / Header - Assuming a fixed height, e.g., h-16 */}
      <header className="h-16 bg-white shadow-md flex items-center justify-between px-6 flex-shrink-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800 truncate" title={storyTitle}>{storyTitle || '스토리 편집기'}</h1>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500 whitespace-nowrap">{autoSaveStatus}</span>
          <button onClick={() => navigate('/')} className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">나가기</button>
        </div>
      </header>

      {/* Main Content Area (ReactFlow + Sidebar) */}
      <div ref={editorRef} className="flex flex-1 overflow-hidden"> {/* Added ref here */}
        {/* ReactFlow Canvas Area */}
        <div ref={reactFlowWrapper} className="flex-grow h-full relative bg-white"> {/* Added reactFlowWrapper ref */}
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              isValidConnection={isValidConnection}
              fitView
              onInit={setReactFlowInstance} // Store reactflow instance
              className="bg-gradient-to-br from-gray-50 to-gray-200" // Added a subtle gradient
              deleteKeyCode={['Backspace', 'Delete']}
              onNodeClick={(_, node) => setSelectedNodeForEdit(node)}
              onPaneClick={() => setSelectedNodeForEdit(null)}
            >
              <MiniMap nodeStrokeWidth={3} zoomable pannable />
              <Controls />
              <Background color="#ccc" variant="dots" gap={16} size={1} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* NodeEditSidebar - This will take remaining height from parent */}
        {selectedNodeForEdit && (
          // The parent div of NodeEditSidebar now has flex-1 and overflow-hidden,
          // NodeEditSidebar itself has h-full, so it should take the full height of this flex container part.
          <div className="w-80 h-full flex-shrink-0 border-l border-gray-300 bg-gray-50">
             {/* NodeEditSidebar's internal h-full and overflow-hidden should now work correctly */}
            <NodeEditSidebar
              key={selectedNodeForEdit.id} 
              selectedNode={selectedNodeForEdit}
              allNodes={nodes}
              allEdges={edges}
              onNodeDataChange={handleNodeDataChange}
              onEdgeChange={handleEdgeChange}
              onClose={() => setSelectedNodeForEdit(null)}
              isCycleCallback={isCycle} 
              onAiGenerate={handleAiGenerationForNode} 
            />
          </div>
        )}
      </div>
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
