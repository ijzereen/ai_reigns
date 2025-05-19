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
  const [inputPrompt, setInputPrompt] = useState('');
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
      setInputPrompt(selectedNode.data?.inputPrompt || '');
      if (fileInputRef.current) fileInputRef.current.value = "";
      const edgesFromThisNode = Array.isArray(allEdges) ? allEdges.filter(edge => edge.source === selectedNode.id) : [];
      setOutgoingEdges(edgesFromThisNode);
    } else {
      setNodeLabel(''); setGameLogicNodeType('STORY'); setTextContent('');
      setCharacterName(''); setImageUrl(''); setImageFile(null); setInputPrompt('');
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
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
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
      ...( (gameLogicNodeType === 'QUESTION_INPUT' && inputPrompt.trim()) && { inputPrompt: inputPrompt.trim() } )
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
      <div className="w-80 bg-gray-50 border-l border-gray-200 h-full shadow-lg flex flex-col overflow-hidden">
        <div className="p-5 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-teal-700">노드 편집 (ID: {selectedNode.id.substring(0,8)}...)</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="닫기">&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="nodeLabelSidebar" className="block text-sm font-medium text-gray-700 mb-1">노드 제목 (라벨)</label>
              <input type="text" id="nodeLabelSidebar" value={nodeLabel} onChange={(e) => handleNodeFieldChange('label', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"/>
            </div>
            <div className="mb-4">
              <label htmlFor="gameLogicNodeTypeSidebar" className="block text-sm font-medium text-gray-700 mb-1">노드 타입 (게임 로직)</label>
              <select id="gameLogicNodeTypeSidebar" value={gameLogicNodeType} onChange={handleGameLogicTypeChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                {editorNodeTypes.map(typeOption => (
                  <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">이야기/질문 내용</label>
              <div 
                onClick={() => openTextModal('textContent', textContent, '이야기/질문 내용 편집')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white min-h-[80px] cursor-pointer hover:border-teal-500"
              >
                {textContent ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{textContent.length > 100 ? `${textContent.substring(0, 97)}...` : textContent}</p>
                ) : (
                  <p className="text-sm text-gray-400">내용을 입력하려면 더블 클릭하세요...</p>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="characterNameSidebar" className="block text-sm font-medium text-gray-700 mb-1">캐릭터 이름</label>
              <div className="flex items-center">
                <select 
                  id="characterNameSidebar" 
                  value={characterName} 
                  onChange={(e) => handleNodeFieldChange('characterName', e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                >
                  <option value="">선택 안함</option>
                  {characterList.map(char => <option key={char} value={char}>{char}</option>)}
                </select>
              </div>
              <div className="mt-2 flex items-center">
                <input 
                  type="text" 
                  value={newCharacterName} 
                  onChange={handleNewCharacterNameChange} 
                  placeholder="새 캐릭터 이름 추가"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
                <button 
                  type="button" 
                  onClick={handleAddCharacter}
                  className="px-4 py-2 bg-teal-500 text-white rounded-r-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 text-sm"
                >
                  추가
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 파일</label>
              <input type="file" accept="image/*" onChange={handleImageFileChange} ref={fileInputRef} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
              {imageUrl && !imageFile && <img src={imageUrl} alt="Node image" className="mt-2 rounded max-h-40 object-contain"/>}
              {imageFile && imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded max-h-40 object-contain"/>}
            </div>
            {gameLogicNodeType === 'QUESTION_INPUT' && (
              <div className="mb-4">
                <label htmlFor="inputPromptSidebar" className="block text-sm font-medium text-gray-700 mb-1">주관식 입력 프롬프트</label>
                <textarea id="inputPromptSidebar" value={inputPrompt} onChange={(e) => setInputPrompt(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" placeholder="플레이어에게 보여줄 입력 안내 (예: 당신의 이름은 무엇입니까?)"></textarea>
              </div>
            )}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-2">연결된 선택지 (현재: {outgoingEdges.length}개)</h4>
              {currentTypeInfo && outgoingEdges.length < currentTypeInfo.maxEdges && (
                <button 
                  type="button" 
                  className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-teal-500 hover:text-teal-600"
                >
                  + 새 선택지 추가
                </button>
              )}
              {outgoingEdges.map((edge, index) => (
                <div key={edge.id || `edge-${index}`} className="mt-3 p-3 border rounded-md bg-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-1">선택지 {index + 1}: (ID: {edge.id?.substring(0,5)}...)</p>
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
          </form>
        </div>
        <div className="p-5 border-t border-gray-200 flex-shrink-0">
          <button 
            type="button"
            onClick={handleSubmit}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition ease-in-out duration-150 mb-2"
          >
            노드 정보 저장
          </button>
          <button 
            type="button" 
            onClick={handleOpenAiModal} 
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50 transition ease-in-out duration-150"
          >
            AI로 생성 (실험적)
          </button>
        </div>
      </div>
    </>
  );
}
export default NodeEditSidebar;
