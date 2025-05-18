// src/components/story/NodeEditSidebar.jsx
// (이전 node_edit_sidebar_jsx_v21_final_ux_rules_151200 문서의 코드와 거의 동일, getTargetNodeOptionsForEdge 수정)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import TextEditModal from '../common/TextEditModal';
import AiGenerateModal from '../common/AiGenerateModal';

const defaultCharacterList = [ "나레이터", "문지기", "상인", "마법사", "용사" ];
const editorNodeTypes = [
  { value: 'STORY', label: '스토리', maxEdges: 1, edgeLabelPolicy: 'optional' },
  { value: 'QUESTION', label: '질문 (객관식)', maxEdges: 2, edgeLabelPolicy: 'required' },
  { value: 'QUESTION_INPUT', label: '주관식 질문', maxEdges: Infinity, edgeLabelPolicy: 'optional' },
];
const AVAILABLE_STATS = ["용기", "지혜", "마력", "금화", "생존", "평판", "체력"];

function NodeEditSidebar({ selectedNode, allNodes, allEdges, onNodeDataChange, onEdgeChange, onClose, isCycleCallback, onAiGenerate }) {
  const [nodeLabel, setNodeLabel] = useState('');
  const [gameLogicNodeType, setGameLogicNodeType] = useState('STORY'); 
  const [textContent, setTextContent] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [outgoingEdges, setOutgoingEdges] = useState([]);
  const [characterList, setCharacterList] = useState(defaultCharacterList);
  const [newCharacterName, setNewCharacterName] = useState('');
  const fileInputRef = useRef(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [modalInitialValue, setModalInitialValue] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [currentEditingEdgeId, setCurrentEditingEdgeId] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setNodeLabel(selectedNode.data?.label || '');
      const currentLogicType = selectedNode.data?.type || 'STORY'; 
      setGameLogicNodeType(editorNodeTypes.some(t => t.value === currentLogicType) ? currentLogicType : 'STORY');
      setTextContent(selectedNode.data?.text_content || '');
      setCharacterName(selectedNode.data?.characterName || '');
      setImageUrl(selectedNode.data?.imageUrl || '');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const edgesFromThisNode = Array.isArray(allEdges) ? allEdges.filter(edge => edge.source === selectedNode.id) : [];
      setOutgoingEdges(edgesFromThisNode);
    } else {
      setNodeLabel(''); setGameLogicNodeType('STORY'); setTextContent('');
      setCharacterName(''); setImageUrl(''); setImageFile(null);
      setOutgoingEdges([]);
    }
  }, [selectedNode, allEdges]);

  const parentNodeIds = useMemo(() => {
    if (!selectedNode || !Array.isArray(allEdges)) return [];
    return allEdges.filter(edge => edge.target === selectedNode.id).map(edge => edge.source);
  }, [selectedNode, allEdges]);

  const handleNodeFieldChange = (field, value) => {
    if (field === 'label') setNodeLabel(value);
    else if (field === 'characterName') setCharacterName(value);
  };
  const handleGameLogicTypeChange = (e) => setGameLogicNodeType(e.target.value);
  const handleNewCharacterNameChange = (e) => setNewCharacterName(e.target.value);
  const handleAddCharacter = () => {
    if (newCharacterName.trim() && !characterList.includes(newCharacterName.trim())) {
      setCharacterList(prev => [...prev, newCharacterName.trim()]);
      setCharacterName(newCharacterName.trim()); 
      setNewCharacterName('');
    }
  };
  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };
  const handleEdgeLabelChange = (edgeId, newLabel) => onEdgeChange(edgeId, { label: newLabel });
  const handleStatEffectChange = (edgeId, effectIndex, field, value) => {
    const edgeToUpdate = outgoingEdges.find(e => e.id === edgeId);
    if (!edgeToUpdate) return;

    const updatedStatEffects = (Array.isArray(edgeToUpdate.data?.stat_effects) ? edgeToUpdate.data.stat_effects : []).map((effect, idx) => {
      if (idx === effectIndex) {
        return { ...effect, [field]: field === 'change' ? parseInt(value, 10) || 0 : value };
      }
      return effect;
    });
    onEdgeChange(edgeId, { data: { ...edgeToUpdate.data, stat_effects: updatedStatEffects } });
  };
  const addStatEffect = (edgeId) => {
    const edgeToUpdate = outgoingEdges.find(e => e.id === edgeId);
    if (!edgeToUpdate) return;
    const currentEffects = Array.isArray(edgeToUpdate.data?.stat_effects) ? edgeToUpdate.data.stat_effects : [];
    const newStatEffect = { statName: AVAILABLE_STATS[0], change: 1 }; 
    onEdgeChange(edgeId, { data: { ...edgeToUpdate.data, stat_effects: [...currentEffects, newStatEffect] } });
  };
  const removeStatEffect = (edgeId, effectIndex) => {
    const edgeToUpdate = outgoingEdges.find(e => e.id === edgeId);
    if (!edgeToUpdate || !Array.isArray(edgeToUpdate.data?.stat_effects)) return;
    const updatedStatEffects = edgeToUpdate.data.stat_effects.filter((_, idx) => idx !== effectIndex);
    onEdgeChange(edgeId, { data: { ...edgeToUpdate.data, stat_effects: updatedStatEffects } });
  };
  const handleEdgeLlmPromptChange = (edgeId, newPrompt) => { /* ... */ };
  const handleEdgeTargetChange = (edgeId, newTargetNodeId) => onEdgeChange(edgeId, { target: newTargetNodeId });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedNode) return;

    if (gameLogicNodeType === 'QUESTION' && outgoingEdges.some(edge => !edge.label?.trim())) {
      alert("'질문' 타입 노드의 모든 선택지에는 텍스트(엣지 라벨)를 입력해야 합니다.");
      return;
    }
    if (gameLogicNodeType === 'QUESTION_INPUT' && outgoingEdges.length === 0) {
      alert("'주관식 질문' 타입 노드는 답변 후 분기될 다음 경로(선택지)가 최소 1개 이상 필요합니다.");
      return;
    }

    const updatedNodeData = {
      type: gameLogicNodeType,
      label: nodeLabel,
      text_content: textContent, 
      characterName,
      imageUrl: imageFile ? undefined : imageUrl, 
      imageFile: imageFile || undefined, 
    };
    onNodeDataChange(selectedNode.id, updatedNodeData, selectedNode.type);
  };

  const openTextModal = (field, initialText, title, edgeId = null) => {
    setEditingField(field);
    setModalInitialValue(initialText);
    setModalTitle(title);
    setCurrentEditingEdgeId(edgeId); 
    setIsTextModalOpen(true);
  };

  const handleSaveModalText = (newText) => {
    if (editingField === 'textContent') {
      setTextContent(newText);
      if (selectedNode) {
        // handleSubmit을 통해 저장되므로, 여기서는 즉시 onNodeDataChange를 호출하지 않음
        // 하지만, 부모 컴포넌트에서 selectedNode의 data를 직접 참조한다면 호출 필요
        // 여기서는 textContent 상태만 업데이트하고, 최종 저장은 "노드 정보 저장" 버튼 클릭 시 이루어짐
      }
    } else if (editingField === 'llm_routing_prompt' && currentEditingEdgeId) {
      const edgeToUpdate = outgoingEdges.find(e => e.id === currentEditingEdgeId);
      if (edgeToUpdate) {
        onEdgeChange(currentEditingEdgeId, { data: { ...edgeToUpdate.data, llm_routing_prompt: newText } });
      }
    }
    setIsTextModalOpen(false);
    setEditingField(null);
    setCurrentEditingEdgeId(null);
  };

  const handleOpenAiModal = () => {
    if (selectedNode) {
      setIsAiModalOpen(true);
    } else {
      alert("AI 생성을 위해서는 먼저 노드를 선택해야 합니다.");
    }
  };
  
  const handleAiSubmitFromModal = (aiParams) => {
    if (onAiGenerate) {
        onAiGenerate(aiParams);
    }
    setIsAiModalOpen(false);
  };

  if (!selectedNode) return <div className="w-80 bg-gray-100 p-4 border-l h-full flex flex-col justify-center items-center text-gray-500"><p>편집할 노드를 선택하세요.</p></div>;
  const getNodeDisplayName = (node) => node?.data?.label || `(ID: ${node?.id?.substring(0,5)}...)`;
  const currentTypeInfo = editorNodeTypes.find(t => t.value === gameLogicNodeType);

  const getTargetNodeOptionsForEdge = (currentEdge) => {
    if (!Array.isArray(allNodes) || !selectedNode) return [];
    console.log('[NodeEditSidebar] getTargetNodeOptionsForEdge called for edge:', currentEdge, 'selectedNode:', selectedNode.id);

    const alreadyTargetedByOtherEdgesFromSameSource = outgoingEdges
        .filter(edge => edge.id !== currentEdge.id) 
        .map(edge => edge.target);
    console.log('  alreadyTargetedByOtherEdgesFromSameSource:', alreadyTargetedByOtherEdgesFromSameSource);

    const incomingEdgeSourceIds = Array.isArray(allEdges) ? allEdges
        .filter(edge => edge.target === selectedNode.id)
        .map(edge => edge.source) : [];
    console.log('  incomingEdgeSourceIds (parents of selectedNode):', incomingEdgeSourceIds);

    const options = allNodes.filter(n => {
      console.log(`  Checking node ${n.data?.label} (ID: ${n.id}):`);
      if (n.id === selectedNode.id) {
        console.log(`    REJECTED: Is selectedNode itself.`);
        return false;
      }
      if (incomingEdgeSourceIds.includes(n.id)) {
        console.log(`    REJECTED: Is a parent of selectedNode.`);
        return false;
      }
      if (n.id === currentEdge.target) {
        console.log(`    ACCEPTED: Is current target of the edge.`);
        return true;
      }
      if (alreadyTargetedByOtherEdgesFromSameSource.includes(n.id)) {
        console.log(`    REJECTED: Already targeted by another edge from the same source.`);
        return false;
      }
      if (isCycleCallback && isCycleCallback(selectedNode.id, n.id, allEdges.map(e => e.id === currentEdge.id ? {...e, target: n.id} : e ))) {
        console.log(`    REJECTED: Would create a cycle.`);
        return false;
      }
      console.log(`    ACCEPTED: Passed all filters.`);
      return true;
    });
    console.log('  Final options:', options.map(o => ({id: o.id, label: o.data?.label })));
    return options;
  };
  
  return (
    <>
      <TextEditModal 
        isOpen={isTextModalOpen} 
        initialValue={modalInitialValue} 
        title={modalTitle} 
        onClose={() => setIsTextModalOpen(false)} 
        onSave={handleSaveModalText}
        maxLength={editingField === 'textContent' ? 1000 : (editingField === 'llm_routing_prompt' ? 500 : undefined)}
      />
      <AiGenerateModal 
        isOpen={isAiModalOpen} 
        currentNode={selectedNode} 
        onClose={() => setIsAiModalOpen(false)} 
        onSubmit={handleAiSubmitFromModal} 
      />
      <div className="w-80 bg-gray-50 p-5 border-l border-gray-200 h-full shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-teal-700">노드 편집 (ID: {selectedNode.id.substring(0,8)}...)</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label="닫기">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="mb-4">
            <label htmlFor="nodeLabelSidebar" className="block text-sm font-medium text-gray-700 mb-1">노드 제목 (라벨)</label>
            <input type="text" id="nodeLabelSidebar" value={nodeLabel} onChange={(e) => handleNodeFieldChange('label', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"/>
          </div>
          <div className="mb-4">
            <label htmlFor="gameLogicNodeTypeSidebar" className="block text-sm font-medium text-gray-700 mb-1">노드 타입 (게임 로직)</label>
            <select id="gameLogicNodeTypeSidebar" value={gameLogicNodeType} onChange={handleGameLogicTypeChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
              {editorNodeTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="textContentSidebarDisplay" className="block text-sm font-medium text-gray-700 mb-1">이야기/질문 내용</label>
            <div 
              id="textContentSidebarDisplay" 
              onDoubleClick={() => openTextModal('textContent', textContent, '이야기/질문 내용 편집')} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white min-h-[80px] cursor-pointer hover:border-teal-500" 
              title="더블 클릭하여 편집"
            >
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{textContent || "내용을 입력하려면 더블 클릭하세요..."}</p>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="characterNameInputSidebar" className="block text-sm font-medium text-gray-700 mb-1">캐릭터 이름</label>
            <input list="characterDatalistSidebar" id="characterNameInputSidebar" value={characterName} onChange={(e) => handleNodeFieldChange('characterName', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="목록에서 선택 또는 직접 입력"/>
            <datalist id="characterDatalistSidebar">
              {characterList.map(char => <option key={char} value={char} />)}
            </datalist>
            <div className="mt-2 flex">
              <input type="text" value={newCharacterName} onChange={handleNewCharacterNameChange} className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="새 캐릭터 이름 추가"/>
              <button type="button" onClick={handleAddCharacter} className="px-4 py-2 bg-teal-500 text-white rounded-r-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 text-sm">추가</button>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="imageUploadSidebar" className="block text-sm font-medium text-gray-700 mb-1">이미지 파일</label>
            <input type="file" id="imageUploadSidebar" accept="image/*" onChange={handleImageFileChange} ref={fileInputRef} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
            {imageUrl && !imageFile && (<div className="mt-2 border border-gray-200 rounded-md p-2 flex justify-center items-center bg-gray-100 max-h-48 overflow-hidden"><img src={imageUrl} alt="미리보기" className="max-h-44 max-w-full object-contain rounded" /></div>)}
            {imageFile && imageUrl && (<div className="mt-2 border border-gray-200 rounded-md p-2 flex justify-center items-center bg-gray-100 max-h-48 overflow-hidden"><img src={imageUrl} alt="새 이미지 미리보기" className="max-h-44 max-w-full object-contain rounded" /></div>)}
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-3 border-t pt-3 mt-3">
              연결된 선택지 (현재: {outgoingEdges.length}개
              {currentTypeInfo?.maxEdges !== undefined && currentTypeInfo.maxEdges !== Infinity && ` / 최대: ${currentTypeInfo.maxEdges}`}
              {gameLogicNodeType === 'QUESTION_INPUT' && outgoingEdges.length === 0 && <span className="text-xs text-red-500 ml-2"> (최소 1개 필요)</span>}
              )
            </h4>
            {outgoingEdges.length === 0 && (
                <p className="text-sm text-gray-500">
                    이 노드에서 나가는 선택지가 없습니다. 
                    {gameLogicNodeType !== 'QUESTION_INPUT' ? '캔버스에서 다른 노드로 연결선을 그리세요.' : '답변 후 분기될 다음 노드들을 캔버스에서 연결하세요.'}
                </p>
            )}
            
            {outgoingEdges.map((edge) => (
              <div key={edge.id} className="p-3 mb-3 border border-gray-300 rounded-md bg-white shadow-sm">
                <div className="mb-2">
                  <label htmlFor={`edgeLabel-${edge.id}`} className="block text-xs font-medium text-gray-600">
                    선택지 텍스트 (엣지 라벨)
                    {gameLogicNodeType === 'QUESTION' && <span className="text-red-500 ml-1">*필수</span>}
                  </label>
                  <input type="text" id={`edgeLabel-${edge.id}`} value={edge.label || ''} onChange={(e) => handleEdgeLabelChange(edge.id, e.target.value)} className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="선택지에 표시될 텍스트"/>
                </div>
                <div className="mb-2">
                  <label htmlFor={`edgeTarget-${edge.id}`} className="block text-xs font-medium text-gray-600">다음 노드</label>
                  <select 
                    id={`edgeTarget-${edge.id}`} 
                    value={edge.target} 
                    onChange={(e) => handleEdgeTargetChange(edge.id, e.target.value)} 
                    className="mt-1 block w-full px-2 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    {allNodes.find(n => n.id === edge.target) ? 
                      <option key={edge.target} value={edge.target}>{getNodeDisplayName(allNodes.find(n => n.id === edge.target))}</option> 
                      : <option value="" disabled>연결된 노드 없음</option> 
                    }
                    {getTargetNodeOptionsForEdge(edge).map(n => (
                        n.id !== edge.target && 
                        <option key={n.id} value={n.id}> 
                          {getNodeDisplayName(n)}
                        </option> 
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-600">스탯 변화</label>
                    {(Array.isArray(edge.data?.stat_effects) ? edge.data.stat_effects : []).map((effect, effectIndex) => (
                        <div key={effectIndex} className="flex items-center space-x-2 mt-1">
                            <select value={effect.statName || ''} onChange={(e) => handleStatEffectChange(edge.id, effectIndex, 'statName', e.target.value)} className="flex-grow px-2 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-teal-500 focus:border-teal-500">
                                <option value="" disabled={!!effect.statName}>스탯 선택...</option>
                                {AVAILABLE_STATS.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                            </select>
                            <input type="number" value={effect.change || 0} onChange={(e) => handleStatEffectChange(edge.id, effectIndex, 'change', e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500" placeholder="값"/>
                            <button type="button" onClick={() => removeStatEffect(edge.id, effectIndex)} className="text-red-500 hover:text-red-700 text-xs">삭제</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addStatEffect(edge.id)} className="mt-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-md border border-gray-300">+ 스탯 변화 추가</button>
                </div>
                {gameLogicNodeType === 'QUESTION_INPUT' && (
                  <div className="mb-2">
                    <label htmlFor={`edgeLlmPrompt-${edge.id}`} className="block text-xs font-medium text-blue-700">LLM 라우팅 조건/프롬프트</label>
                    <div 
                        onDoubleClick={() => openTextModal('llm_routing_prompt', edge.data?.llm_routing_prompt || '', `엣지 '${edge.label || edge.id}'의 LLM 프롬프트 편집`, edge.id)}
                        className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm bg-white min-h-[40px] cursor-pointer hover:border-teal-500" 
                        title="더블 클릭하여 편집"
                    >
                       <p className="text-sm text-gray-700 whitespace-pre-wrap break-words truncate">{edge.data?.llm_routing_prompt || "LLM 프롬프트를 입력하려면 더블 클릭..."}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="my-4 py-4 border-t border-b border-gray-300">
            <button 
              type="button" 
              onClick={handleOpenAiModal} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
            >
              ✨ AI로 다음 스토리 생성
            </button>
          </div>
          <div className="mt-auto pt-4 sticky bottom-0 bg-gray-50 pb-3">
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm">
              노드 정보 저장
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
export default NodeEditSidebar;
