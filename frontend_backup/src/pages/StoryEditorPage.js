import React, { useState, useCallback, useEffect } from 'react';
// 아이콘 라이브러리
import { Save, ChevronLeft, PlusCircle, Trash2, Edit2, Zap, MousePointerSquare, Eraser, Type, ListPlus, Link2, Wand2, Settings2 } from 'lucide-react';

// React Flow
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css'; // React Flow 기본 스타일

// --- UI 디자인 상수 ---
const POINT_COLOR = '#50AD98';
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const TEXT_COLOR = '#111827';
const TEXT_COLOR_SECONDARY = '#4B5563';
const BORDER_COLOR = '#E5E7EB';
const BACKGROUND_COLOR_EDITOR = '#F9FAFB';
const NODE_BACKGROUND_COLOR = '#FFFFFF';
const NODE_BORDER_COLOR = BORDER_COLOR;
const NODE_SELECTED_BORDER_COLOR = POINT_COLOR;
const INPUT_BACKGROUND_COLOR = '#FFFFFF';


// --- 공용 UI 컴포넌트 (실제로는 src/components/ 에서 import) ---
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false, iconLeft, size = 'normal' }) => { const baseStyle = `font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-sm rounded-md`; const sizeStyles = { small: 'px-3 py-1.5 text-xs', normal: 'px-4 py-2 text-sm', large: 'px-6 py-2.5 text-base' }; const variants = { primary: `bg-[${POINT_COLOR}] hover:bg-[#408E7B] text-white focus:ring-[${POINT_COLOR}] border border-transparent`, secondary: `bg-gray-100 hover:bg-gray-200 text-[${TEXT_COLOR}] focus:ring-[${POINT_COLOR}] border border-[${BORDER_COLOR}]`, ghost: `bg-transparent hover:bg-gray-100 text-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`, }; return ( <button type={type} onClick={onClick} className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} disabled={disabled}> {iconLeft && <span className={children ? "mr-1.5" : ""}>{iconLeft}</span>} {children} </button> ); };
const InputField = ({ id, label, type = 'text', value, onChange, placeholder, error, required = false, className = '', disabled = false, rows }) => { const commonProps = { id, value, onChange, placeholder, required, disabled, className: `w-full px-3 py-2 bg-[${INPUT_BACKGROUND_COLOR}] border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : `border-[${BORDER_COLOR}] focus:border-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`} rounded-md outline-none transition-colors text-[${TEXT_COLOR}] placeholder-gray-400 text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${className}` }; return ( <div className="mb-3 w-full"> {label && ( <label htmlFor={id} className={`block text-xs font-medium mb-1 ${error ? 'text-red-600' : `text-[${TEXT_COLOR_SECONDARY}]`}`} > {label} {required && <span className="text-red-500">*</span>} </label> )} {type === 'textarea' ? <textarea {...commonProps} rows={rows || 3}></textarea> : <input type={type} {...commonProps} />} {error && <p className="mt-1 text-xs text-red-500">{error}</p>} </div> );};
const SelectField = ({ id, label, value, onChange, options, error, required = false, className = '', disabled = false }) => ( <div className="mb-3 w-full"> {label && ( <label htmlFor={id} className={`block text-xs font-medium mb-1 ${error ? 'text-red-600' : `text-[${TEXT_COLOR_SECONDARY}]`}`} > {label} {required && <span className="text-red-500">*</span>} </label> )} <select id={id} value={value} onChange={onChange} disabled={disabled} className={`w-full px-3 py-2 bg-[${INPUT_BACKGROUND_COLOR}] border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : `border-[${BORDER_COLOR}] focus:border-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`} rounded-md outline-none transition-colors text-[${TEXT_COLOR}] text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`} required={required} > {options.map(option => ( <option key={option.value} value={option.value}>{option.label}</option> ))} </select> {error && <p className="mt-1 text-xs text-red-500">{error}</p>} </div> );
// --- 공용 UI 컴포넌트 끝 ---

// NodeType Enum (백엔드 스키마와 동일하게 정의)
const NodeTypeEnum = {
  START: 'START',
  STORY: 'STORY',
  QUESTION: 'QUESTION',
  AI_STORY: 'AI_STORY',
};

const nodeTypeOptions = Object.values(NodeTypeEnum).map(type => ({ value: type, label: type }));

const initialNodes = [
  { id: 'start-node-1', type: 'input', data: { label: '이야기 시작점', nodeType: NodeTypeEnum.START, text_content: '모험이 시작되는 곳입니다.', choices: [{text: '시작!', next_node_id: 'question-node-1'}], llm_prompt: '' }, position: { x: 50, y: 200 }, sourcePosition: Position.Right, style: { background: NODE_BACKGROUND_COLOR, color: TEXT_COLOR, border: `2px solid ${POINT_COLOR}`, borderRadius: '8px', padding: '12px 18px', fontSize: '13px', boxShadow: `0 2px 5px rgba(0,0,0,0.05)`, minWidth: '150px', textAlign: 'center',}, },
  { id: 'question-node-1', data: { label: '첫 번째 분기 질문', nodeType: NodeTypeEnum.QUESTION, text_content: '동굴로 갈 것인가, 숲으로 갈 것인가?', choices: [{text: '동굴', next_node_id: 'outcome-A'}, {text: '숲', next_node_id: 'outcome-B'}], llm_prompt: '플레이어가 어떤 선택을 할지 예측하고, 그에 따른 결과를 흥미롭게 묘사해주세요.' }, position: { x: 300, y: 200 }, sourcePosition: Position.Right, targetPosition: Position.Left, style: { background: NODE_BACKGROUND_COLOR, color: TEXT_COLOR, border: `1px solid ${NODE_BORDER_COLOR}`, borderRadius: '8px', padding: '12px 18px', fontSize: '13px', width: 220, boxShadow: `0 2px 5px rgba(0,0,0,0.05)` }, },
  { id: 'outcome-A', type: 'output', data: { label: '동굴 탐험 결과', nodeType: NodeTypeEnum.STORY, text_content: '동굴은 깊고 어두웠지만, 반짝이는 보석을 발견했다!', choices: [], llm_prompt: '' }, position: { x: 550, y: 100 }, targetPosition: Position.Left, style: { background: NODE_BACKGROUND_COLOR, color: TEXT_COLOR, border: `1px solid ${NODE_BORDER_COLOR}`, borderRadius: '8px', padding: '12px 18px', fontSize: '13px', width: 200, boxShadow: `0 2px 5px rgba(0,0,0,0.05)` }, },
  { id: 'outcome-B', type: 'output', data: { label: '숲 탐험 결과', nodeType: NodeTypeEnum.STORY, text_content: '숲은 아름다웠지만, 길을 잃고 말았다...', choices: [], llm_prompt: '' }, position: { x: 550, y: 300 }, targetPosition: Position.Left, style: { background: NODE_BACKGROUND_COLOR, color: TEXT_COLOR, border: `1px solid ${NODE_BORDER_COLOR}`, borderRadius: '8px', padding: '12px 18px', fontSize: '13px', width: 200, boxShadow: `0 2px 5px rgba(0,0,0,0.05)` }, },
];
const initialEdges = [
  { id: 'e-start-q1', source: 'start-node-1', target: 'question-node-1', type: 'smoothstep', style: { stroke: POINT_COLOR, strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: POINT_COLOR, width: 15, height: 15 } },
  { id: 'e-q1-aA', source: 'question-node-1', target: 'outcome-A', type: 'smoothstep', label: '동굴', style: { stroke: TEXT_COLOR_SECONDARY, strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: TEXT_COLOR_SECONDARY } },
  { id: 'e-q1-aB', source: 'question-node-1', target: 'outcome-B', type: 'smoothstep', label: '숲', style: { stroke: TEXT_COLOR_SECONDARY, strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: TEXT_COLOR_SECONDARY } },
];

const StoryEditorPage = ({ storyId, navigateTo }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [storyTitle, setStoryTitle] = useState(storyId === 'new' ? '새 스토리 제목' : `스토리 편집 (ID: ${storyId})`);
  const [rfInstance, setRfInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // 선택된 노드 편집을 위한 임시 상태
  const [editingNodeData, setEditingNodeData] = useState(null);

  const onConnect = useCallback(
    (params) => {
      const newEdge = { 
        ...params, 
        type: 'smoothstep', 
        animated: false, // 애니메이션은 선택적으로
        style: { stroke: POINT_COLOR, strokeWidth: 1.5 }, 
        markerEnd: { type: MarkerType.ArrowClosed, color: POINT_COLOR, width: 15, height: 15 } 
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addDefaultNode = (type = NodeTypeEnum.STORY) => {
    const newNodeId = `node_${nodes.length + 1}_${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const xOffset = nodes.length % 2 === 0 ? 250 : 350; // 간단한 x 위치 분산
    const yPosition = lastNode ? lastNode.position.y + (nodes.length % 3 === 0 ? 0 : (nodes.length % 3 === 1 ? -100 : 100) ) : 100;
    
    const newNode = {
      id: newNodeId,
      data: { 
        label: `새 ${type} 노드`, 
        nodeType: type, 
        text_content: '', 
        choices: type === NodeTypeEnum.QUESTION ? [{ text: '선택지 1', next_node_id: null }] : [],
        llm_prompt: ''
      },
      position: { x: xOffset, y: yPosition },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: { background: NODE_BACKGROUND_COLOR, color: TEXT_COLOR, border: `1px solid ${NODE_BORDER_COLOR}`, borderRadius: '8px', padding: '10px 15px', fontSize: '13px', width: 180, boxShadow: `0 2px 5px rgba(0,0,0,0.05)` },
    };
    if (type === NodeTypeEnum.START) {
      newNode.type = 'input';
      newNode.style.borderColor = POINT_COLOR;
      newNode.style.borderWidth = '2px';
    }
    setNodes((nds) => nds.concat(newNode));
  };
  
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setEditingNodeData({...node.data}); // 편집용 데이터 복사
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setEditingNodeData(null);
  }, []);

  const handleEditingNodeChange = (field, value) => {
    setEditingNodeData(prev => ({...prev, [field]: value}));
  };

  const handleChoiceChange = (choiceIndex, field, value) => {
    setEditingNodeData(prev => {
      const newChoices = [...(prev.choices || [])];
      if (!newChoices[choiceIndex]) newChoices[choiceIndex] = {}; // 새 선택지 항목 초기화
      newChoices[choiceIndex] = {...newChoices[choiceIndex], [field]: value};
      // next_node_id는 문자열이어야 함 (또는 null)
      if (field === 'next_node_id' && value !== null && typeof value !== 'string') {
        newChoices[choiceIndex][field] = String(value);
      }
      return {...prev, choices: newChoices};
    });
  };
  
  const addChoice = () => {
    setEditingNodeData(prev => ({
      ...prev,
      choices: [...(prev.choices || []), { text: '새 선택지', next_node_id: null, stat_effects: {} }]
    }));
  };

  const removeChoice = (choiceIndex) => {
    setEditingNodeData(prev => ({
      ...prev,
      choices: (prev.choices || []).filter((_, index) => index !== choiceIndex)
    }));
  };

  const applyNodeChanges = () => {
    if (!selectedNode || !editingNodeData) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...editingNodeData } } : node
      )
    );
    // 선택된 노드 정보도 업데이트 (선택적, selectedNode가 직접 참조가 아니라면)
    setSelectedNode(prev => ({...prev, data: {...editingNodeData}})); 
    // alert('노드 변경사항이 임시 적용되었습니다. (저장 버튼을 눌러야 최종 저장됩니다)');
  };
  
  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
      setEditingNodeData(null);
    } else {
      alert('삭제할 노드를 먼저 선택하세요.');
    }
  };


  useEffect(() => {
    if (storyId !== 'new') {
      console.log(`API Call: 스토리 ${storyId} 상세 정보 및 노드/엣지 로드`);
      // TODO: mockApi.getStoryDetails(storyId).then(data => { setStoryTitle(data.title); setNodes(data.nodes); setEdges(data.edges); });
    }
    // 초기 노드 데이터에 nodeType이 없으면 기본값 설정 (선택적)
    setNodes(prevNodes => prevNodes.map(n => ({...n, data: {...n.data, nodeType: n.data.nodeType || NodeTypeEnum.STORY, choices: n.data.choices || [], llm_prompt: n.data.llm_prompt || '' }})));
  }, [storyId, setNodes, setEdges]); // setNodes, setEdges 추가

  const handleSaveStory = () => {
    // TODO: 실제 API 호출로 스토리 저장
    const storyDataToSave = {
      storyId,
      title: storyTitle,
      nodes: nodes.map(n => ({ 
        id: n.id, 
        type: n.type, // React Flow의 input/output/default 타입
        data: { // 실제 저장할 데이터
            label: n.data.label,
            nodeType: n.data.nodeType, // 우리가 정의한 START, STORY, QUESTION 등
            text_content: n.data.text_content,
            choices: n.data.choices,
            llm_prompt: n.data.llm_prompt,
        }, 
        position: n.position, 
        style: n.style, 
        sourcePosition: n.sourcePosition, 
        targetPosition: n.targetPosition 
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, label: e.label, style: e.style, markerEnd: e.markerEnd })),
    };
    console.log('저장할 데이터:', storyDataToSave);
    alert('스토리 저장 기능이 호출되었습니다 (콘솔 확인).');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-[${CARD_BACKGROUND_COLOR}] rounded-xl shadow-lg border overflow-hidden" style={{borderColor: BORDER_COLOR}}>
      <div className="flex justify-between items-center p-3.5 border-b" style={{borderColor: BORDER_COLOR}}>
        <input 
          type="text" 
          value={storyTitle} 
          onChange={(e) => setStoryTitle(e.target.value)}
          className={`text-lg font-medium bg-transparent text-[${TEXT_COLOR}] focus:outline-none focus:ring-1 focus:ring-[${POINT_COLOR}] rounded px-2 py-1 w-1/2`}
          placeholder="스토리 제목 입력"
        />
        <div className="space-x-2 flex items-center">
          <Button onClick={() => addDefaultNode(NodeTypeEnum.STORY)} variant="secondary" size="small" iconLeft={<PlusCircle size={14}/>}>STORY 노드</Button>
          <Button onClick={() => addDefaultNode(NodeTypeEnum.QUESTION)} variant="secondary" size="small" iconLeft={<GitFork size={14}/>}>QUESTION 노드</Button>
          <Button onClick={handleSaveStory} size="small" iconLeft={<Save size={14}/>}>저장</Button>
          <Button onClick={() => navigateTo('stories')} variant="ghost" size="small" iconLeft={<ChevronLeft size={14}/>}>목록</Button>
        </div>
      </div>
      <div className="flex-grow relative" style={{backgroundColor: BACKGROUND_COLOR_EDITOR}}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          attributionPosition="bottom-left"
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <MiniMap nodeBorderRadius={8} className="!bg-gray-50 !border !border-gray-300 !rounded-md" style={{height: 100, width: 150}} />
          <Controls className="[&>button]:bg-white [&>button]:border [&>button:hover]:bg-gray-100 [&>button]:shadow-sm" style={{'--tw-border-opacity': '1', borderColor: BORDER_COLOR, color: TEXT_COLOR_SECONDARY}} />
          <Background variant="dots" gap={20} size={0.7} color={BORDER_COLOR} />
          <Panel position="top-left" className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border" style={{borderColor: BORDER_COLOR}}>
            <h3 className="text-xs font-medium mb-1.5 text-center" style={{color: TEXT_COLOR_SECONDARY}}>편집 도구</h3>
            <div className="space-y-1.5">
              <Button onClick={() => selectedNode ? setSelectedNode(selectedNode) : alert('편집할 노드를 먼저 선택하세요.')} variant="ghost" size="small" className="w-full !justify-start" iconLeft={<Edit2 size={14}/>}>선택 노드 편집</Button>
              <Button onClick={deleteSelectedNode} variant="ghost" size="small" className="w-full !justify-start !text-red-500 hover:!bg-red-50" iconLeft={<Trash2 size={14}/>}>선택 노드 삭제</Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* 선택된 노드 편집 패널 */}
      {selectedNode && editingNodeData && (
        <div className="absolute top-24 right-4 w-80 bg-white p-4 rounded-lg shadow-xl border z-20 max-h-[calc(100vh-12rem)] overflow-y-auto" style={{borderColor: BORDER_COLOR}}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold" style={{color: POINT_COLOR}}>
              노드 편집 <span className="text-xs font-normal text-gray-400">(ID: {selectedNode.id})</span>
            </h3>
            <button onClick={onPaneClick} className="text-gray-400 hover:text-gray-600"><Eraser size={16}/></button>
          </div>
          
          <InputField id="node-label-editor" label="노드 제목 (라벨)" value={editingNodeData.label || ''} onChange={(e) => handleEditingNodeChange('label', e.target.value)} />
          
          <SelectField 
            id="node-type-editor"
            label="노드 타입"
            value={editingNodeData.nodeType || NodeTypeEnum.STORY}
            onChange={(e) => handleEditingNodeChange('nodeType', e.target.value)}
            options={nodeTypeOptions}
          />

          <InputField 
            id="node-text_content-editor" 
            label="노드 내용 (텍스트)" 
            type="textarea" 
            rows={4}
            value={editingNodeData.text_content || ''} 
            onChange={(e) => handleEditingNodeChange('text_content', e.target.value)} 
          />

          <div className="mt-3 mb-2">
            <label className="block text-xs font-medium mb-1" style={{color: TEXT_COLOR_SECONDARY}}>선택지 (Choices)</label>
            {(editingNodeData.choices || []).map((choice, index) => (
              <div key={index} className="p-2.5 border rounded-md mb-2" style={{borderColor: BORDER_COLOR}}>
                <InputField id={`choice-text-${index}`} label={`선택지 ${index + 1} 텍스트`} value={choice.text || ''} onChange={(e) => handleChoiceChange(index, 'text', e.target.value)} placeholder="선택지 내용" />
                <InputField id={`choice-next-${index}`} label="다음 노드 ID" value={choice.next_node_id || ''} onChange={(e) => handleChoiceChange(index, 'next_node_id', e.target.value)} placeholder="연결될 노드 ID" />
                {/* TODO: stat_effects를 위한 더 나은 UI (예: 키-값 쌍 추가/삭제) */}
                <InputField id={`choice-stat-${index}`} label="스탯 변경 (예: 용기:1,지혜:-1)" value={ typeof choice.stat_effects === 'object' ? JSON.stringify(choice.stat_effects) : (choice.stat_effects || '') } onChange={(e) => handleChoiceChange(index, 'stat_effects', e.target.value)} placeholder='{"용기": 1, "지혜": -1}' />
                <Button onClick={() => removeChoice(index)} variant="danger" size="small" className="w-full mt-1 !bg-red-50 !text-red-600 hover:!bg-red-100" iconLeft={<Trash2 size={12}/>}>선택지 삭제</Button>
              </div>
            ))}
            <Button onClick={addChoice} variant="outline" size="small" className="w-full mt-1 !border-dashed" iconLeft={<ListPlus size={14}/>}>선택지 추가</Button>
          </div>

          <InputField 
            id="node-llm_prompt-editor" 
            label="LLM 프롬프트 (선택)" 
            type="textarea" 
            rows={3}
            value={editingNodeData.llm_prompt || ''} 
            onChange={(e) => handleEditingNodeChange('llm_prompt', e.target.value)} 
            placeholder="LLM에게 전달할 프롬프트를 입력하세요..."
          />
          
          <Button onClick={applyNodeChanges} size="small" className="w-full mt-3" iconLeft={<Save size={14}/>}>변경 사항 적용</Button>
        </div>
      )}
    </div>
  );
};

// export default StoryEditorPage; // 실제 파일에서는 export
