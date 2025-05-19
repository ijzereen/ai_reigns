import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
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

const AUTO_SAVE_STATUS = {
  IDLE: '마지막 저장: কিছুক্ষণ আগে', 
  SAVING: '저장 중...',
  SUCCESS: '모든 변경 사항이 저장되었습니다.',
  ERROR: '자동 저장 실패.',
};

const internalAddNode = () => { console.log("internalAddNode called (placeholder)"); };

const nodeTypes = { custom: CustomNode };

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

  const triggerShakeEffect = useCallback((message = "유효하지 않은 작업입니다!") => {
    try { /* ... (알림음 로직) ... */ } catch(e) { console.warn("알림음 재생 실패:", e); }
    alert(`🚫 ${message}`);
  }, []);

  const internalSave = useCallback(async (isAutoSave = false) => {
    if (!storyId) {
      console.error("스토리 ID가 없습니다. 저장할 수 없습니다.");
      if (isAutoSave) setAutoSaveStatus(AUTO_SAVE_STATUS.ERROR);
      else alert("스토리 ID가 없습니다. 저장할 수 없습니다.");
      return;
    }
    setAutoSaveStatus(AUTO_SAVE_STATUS.SAVING);
    try {
      await storyService.saveStoryGraph(storyId, storyTitle, storyDescription, nodes, edges);
      setLastSaved(new Date());
      setAutoSaveStatus(AUTO_SAVE_STATUS.SUCCESS);
    } catch (error) {
      console.error("스토리 저장 중 오류 발생:", error);
      setAutoSaveStatus(AUTO_SAVE_STATUS.ERROR);
      if (!isAutoSave) {
        triggerShakeEffect(`스토리 저장 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  }, [storyId, storyTitle, storyDescription, nodes, edges, triggerShakeEffect]);

  const debouncedAutoSave = useDebouncedCallback(internalSave, 2000);

  useEffect(() => {
    if (storyId) {
      console.log("[Mount/StoryID Effect] Loading story data. Setting isLoading=true, isInitialLoadDone.current=false");
      setIsLoading(true);
      isInitialLoadDone.current = false; 
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
            setLastSaved(new Date()); 
            setAutoSaveStatus(prev => prev === AUTO_SAVE_STATUS.IDLE || prev === AUTO_SAVE_STATUS.SUCCESS ? `마지막 저장: ${new Date().toLocaleTimeString()}`: prev);
          } else {
            const defaultTitle = `스토리 "${storyId}" 편집 (로드 실패)`;
            if (setCurrentStoryTitle) setCurrentStoryTitle(defaultTitle);
            setStoryTitle(defaultTitle);
            setNodes([]); setEdges([]);
          }
        })
        .catch(error => {
          console.error("스토리 데이터 로드 실패:", error);
          triggerShakeEffect("스토리 데이터를 불러오는 데 실패했습니다.");
          setNodes([]); setEdges([]);
        })
        .finally(() => {
          console.log("[Mount/StoryID Effect] Finally block. Setting isLoading=false, isInitialLoadDone.current=true");
          setIsLoading(false);
          isInitialLoadDone.current = true; 
        });
    } else {
      navigate('/');
    }
  }, [storyId, navigate, setCurrentStoryTitle, triggerShakeEffect]);

  useEffect(() => {
    console.log("---------------------------------------------------------");
    console.log("[AutoSave Effect Check] Current states:");
    console.log(`  isInitialLoadDone.current: ${isInitialLoadDone.current}`);
    console.log(`  isLoading: ${isLoading}`);
    console.log(`  nodes length: ${nodes.length}`);
    console.log(`  storyTitle: ${storyTitle}`);
    if (!isInitialLoadDone.current || isLoading) { 
      console.log("[AutoSave Effect] Skipping: Initial load not done or still loading.");
      return;
    }
    console.log("[AutoSave Effect] Conditions met. Calling debouncedAutoSave.");
    debouncedAutoSave(true); 
  }, [nodes, edges, storyTitle, storyDescription, debouncedAutoSave, isLoading]);
  
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = { 
        ...params, 
        type: 'smoothstep',
        markerEnd: { type: 'ArrowClosed', color: '#60A5FA' },
        animated: false, 
        style: { strokeWidth: 1.5, stroke: '#60A5FA'} 
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edges, setEdges]
  );

  const handleNodeDataChange = useCallback((nodeId, newDataFromSidebar, reactFlowNodeType) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { 
            ...node, 
            data: { ...node.data, ...newDataFromSidebar },
          };
          return updatedNode;
        }
        return node;
      })
    );
    setSelectedNodeForEdit(prev => prev && prev.id === nodeId ? { ...prev, data: {...prev.data, ...newDataFromSidebar} } : prev);
  }, [setNodes]);

  const onNodeClick = useCallback((event, node) => setSelectedNodeForEdit(node), []);
  const onPaneClick = useCallback(() => setSelectedNodeForEdit(null), []);
  const handleCloseSidebar = useCallback(() => setSelectedNodeForEdit(null), []);

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) return false;
      return true; 
    },
    [nodes, edges] 
  );

  useImperativeHandle(ref, () => ({
    triggerAddNode: internalAddNode,
    triggerSave: () => internalSave(false),
    getSelectedNodeId: () => selectedNodeForEdit?.id,
  }), [internalSave, selectedNodeForEdit]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full text-xl">스토리 로딩 중...</div>;
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-xs text-gray-500 p-1 px-3 bg-gray-50 border-b text-right">
        {autoSaveStatus}
      </div>
      <div className="flex-grow flex">
        <motion.div 
          className="flex-grow bg-white"
        >
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} isValidConnection={isValidConnection}
            onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView 
            className="story-editor-flow"
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
            onClose={handleCloseSidebar}
          />
        )}
      </div>
    </div>
  );
});

export default StoryEditorPage; 