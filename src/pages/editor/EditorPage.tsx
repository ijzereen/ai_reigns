import React, { useCallback, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './EditorPage.css';
import GamePlayPage from './GamePlayPage';

interface EditorPageProps {
  onBack?: () => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ onBack }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(2); // 시작 노드가 1이므로 2부터
  const [showNodePopup, setShowNodePopup] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showPromptPopup, setShowPromptPopup] = useState(false);
  const [showChoicePopup, setShowChoicePopup] = useState(false);
  const [showStatPopup, setShowStatPopup] = useState(false);
  const [showAskPopup, setShowAskPopup] = useState(false);
  const [showAskStatPopup, setShowAskStatPopup] = useState(false);
  const [showRoutingPopup, setShowRoutingPopup] = useState(false);
  const [showGamePlay, setShowGamePlay] = useState(false);

  const handleNodeEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isEditing: node.id === nodeId,
        }
      }))
    );
  }, [setNodes]);

  const exitEditMode = useCallback(() => {
    setEditingNodeId(null);
    setShowPromptPopup(false);
    setShowChoicePopup(false);
    setShowStatPopup(false);
    setShowAskPopup(false);
    setShowAskStatPopup(false);
    setShowRoutingPopup(false);
    setNodes((nds) => 
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isEditing: false,
        }
      }))
    );
  }, [setNodes]);

  const handlePromptClick = useCallback((e: React.MouseEvent) => {
    console.log('프롬프트 클릭됨!'); // 디버깅용
    e.stopPropagation();
    setShowPromptPopup(true);
  }, []);

  const handleChoiceClick = useCallback((e: React.MouseEvent) => {
    console.log('선택 클릭됨!'); // 디버깅용
    e.stopPropagation();
    setShowChoicePopup(true);
  }, []);

  const handleStatClick = useCallback((e: React.MouseEvent) => {
    console.log('스탯 클릭됨!'); // 디버깅용
    e.stopPropagation();
    setShowStatPopup(true);
  }, []);

  const handleAskClick = useCallback((e: React.MouseEvent) => {
    console.log('질문 클릭됨!'); // 디버깅용
    e.stopPropagation();
    setShowAskPopup(true);
  }, []);

  const handleAskStatClick = useCallback((e: React.MouseEvent) => {
    console.log('질문 스탯 클릭됨!'); // 디버깅용
    e.stopPropagation();
    setShowAskStatPopup(true);
  }, []);

  const handleRoutingClick = useCallback((e: React.MouseEvent) => {
    console.log('라우팅 클릭됨!'); // 디버깅용
    e.stopPropagation();
    setShowRoutingPopup(true);
  }, []);

  const closePromptPopup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPopup(false);
  }, []);

  const closeChoicePopup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChoicePopup(false);
  }, []);

  const closeStatPopup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatPopup(false);
  }, []);

  const closeAskPopup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAskPopup(false);
  }, []);

  const closeAskStatPopup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAskStatPopup(false);
  }, []);

  const closeRoutingPopup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRoutingPopup(false);
  }, []);

  // 커스텀 노드 타입 정의 - React.memo로 최적화
  const nodeTypes = useMemo(() => ({
    story: React.memo(({ data }: { data: any }) => (
      <div 
        className={`story-node ${data.isEditing ? 'story-node-editing' : ''}`}
        onDoubleClick={() => handleNodeEdit(data.nodeId)}
        onClick={(e) => {
          if (data.isEditing) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {/* 입력 연결점 (왼쪽) */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#FFD700', border: '2px solid #B8860B' }}
        />
        
        <div className="node-header">
          <span className="node-title">스토리 조각</span>
        </div>
        <div className="node-divider"></div>
        <div className="node-content-area">
          {data.isEditing ? (
            <div className="prompt-click-area" onClick={handlePromptClick}>
              <span className="node-placeholder">
                스토리 프롬프트를 작성하세요 ...
              </span>
            </div>
          ) : (
            <span className="node-placeholder">
              프롬프트를 작성하세요 ...
            </span>
          )}
        </div>
        {data.isEditing && (
          <>
            <div className="node-divider"></div>
            <div className="image-upload-section">
              <span className="image-upload-text">이미지 업로드</span>
            </div>
          </>
        )}
        {data.isStart && (
          <div className="start-label">
            <span>시작</span>
          </div>
        )}
        
        {/* 출력 연결점 (오른쪽) */}
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#FFD700', border: '2px solid #B8860B' }}
        />
      </div>
    )),
    choice: React.memo(({ data }: { data: any }) => (
      <div 
        className={`choice-node ${data.isEditing ? 'choice-node-editing' : ''}`}
        onDoubleClick={() => handleNodeEdit(data.nodeId)}
        onClick={(e) => {
          if (data.isEditing) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {/* 입력 연결점 (왼쪽) */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#FF8C00', border: '2px solid #FF4500' }}
        />
        
        <div className="node-header">
          <span className="node-title">선택 조각</span>
        </div>
        <div className="node-divider"></div>
        <div className="node-content-area">
          {data.isEditing ? (
            <div className="prompt-click-area" onClick={handleChoiceClick}>
              <span className="node-placeholder">
                선택 프롬프트를 작성하세요 ...
              </span>
            </div>
          ) : (
            <span className="node-placeholder">
              프롬프트를 작성하세요 ...
            </span>
          )}
        </div>
        {data.isEditing && (
          <>
            <div className="node-divider"></div>
            <div className="stat-prompt-section">
              <div className="stat-prompt-click-area" onClick={handleStatClick}>
                <span className="stat-prompt-text">스탯 프롬프트</span>
              </div>
            </div>
            <div className="node-divider"></div>
            <div className="image-upload-section">
              <span className="image-upload-text">이미지 업로드</span>
            </div>
            <div className="node-divider"></div>
            <div className="choice-buttons-section">
              <div className="choice-button-wrapper">
                <button className="choice-yes-btn">예</button>
                <div className="dashed-line dashed-line-yes"></div>
              </div>
              <div className="choice-button-wrapper">
                <button className="choice-no-btn">아니오</button>
                <div className="dashed-line dashed-line-no"></div>
              </div>
            </div>
          </>
        )}
        
        {/* 출력 연결점들 (오른쪽 위/아래) */}
        <Handle
          type="source"
          position={Position.Right}
          id="left"
          style={{ background: '#FF8C00', border: '2px solid #FF4500', top: '35%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{ background: '#FF8C00', border: '2px solid #FF4500', top: '65%' }}
        />
      </div>
    )),
    ask: React.memo(({ data }: { data: any }) => (
      <div 
        className={`ask-node ${data.isEditing ? 'ask-node-editing' : ''}`}
        onDoubleClick={() => handleNodeEdit(data.nodeId)}
        onClick={(e) => {
          if (data.isEditing) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {/* 입력 연결점 (왼쪽) */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#87CEEB', border: '2px solid #4682B4' }}
        />
        
        <div className="node-header">
          <span className="node-title">질문 조각</span>
        </div>
        <div className="node-divider"></div>
        <div className="node-content-area">
          {data.isEditing ? (
            <div className="prompt-click-area" onClick={handleAskClick}>
              <span className="node-placeholder">
                질문 프롬프트를 작성하세요 ...
              </span>
            </div>
          ) : (
            <span className="node-placeholder">
              프롬프트를 작성하세요 ...
            </span>
          )}
        </div>
        {data.isEditing && (
          <>
            <div className="node-divider"></div>
            <div className="routing-prompt-section">
              <div className="routing-prompt-click-area" onClick={handleRoutingClick}>
                <span className="routing-prompt-text">라우팅 프롬프트</span>
              </div>
            </div>
            <div className="node-divider"></div>
            <div className="ask-stat-prompt-section">
              <div className="ask-stat-prompt-click-area" onClick={handleAskStatClick}>
                <span className="ask-stat-prompt-text">스탯 프롬프트</span>
              </div>
            </div>
            <div className="node-divider"></div>
            <div className="image-upload-section">
              <span className="image-upload-text">이미지 업로드</span>
            </div>
          </>
        )}
        
        {/* 출력 연결점 (오른쪽) */}
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#87CEEB', border: '2px solid #4682B4' }}
        />
      </div>
    )),
  }), [handleNodeEdit, handlePromptClick, handleChoiceClick, handleStatClick, handleAskClick, handleAskStatClick, handleRoutingClick]);

  // 초기 시작 노드 생성
  useEffect(() => {
    const startNode: Node = {
      id: 'start-1',
      type: 'story',
      position: { x: 175, y: 419 },
      data: { 
        label: 'story', 
        nodeId: 'start-1',
        isStart: true,
        isEditing: false,
      },
    };
    setNodes([startNode]);
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: 'story' | 'choice' | 'ask') => {
    setShowNodePopup(false);
    
    const id = `${type}-${nodeIdCounter}`;
    const newNode: Node = {
      id,
      type: type,
      position: { 
        x: Math.random() * 400 + 200, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: type,
        nodeId: id,
        isStart: false,
        isEditing: false,
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    setNodeIdCounter((counter) => counter + 1);
  };

  const addStoryNode = () => addNode('story');
  const addChoiceNode = () => addNode('choice');
  const addAskNode = () => addNode('ask');

  const toggleNodePopup = () => {
    setShowNodePopup(!showNodePopup);
  };

  const toggleGamePlay = useCallback(() => {
    setShowGamePlay(!showGamePlay);
  }, [showGamePlay]);

  const handleBackFromGamePlay = useCallback(() => {
    setShowGamePlay(false);
  }, []);

  // 게임 플레이 모드일 때는 GamePlayPage 렌더링
  if (showGamePlay) {
    return <GamePlayPage onBack={handleBackFromGamePlay} />;
  }

  return (
    <div className="editor-page">
      {/* 스토리 프롬프트 팝업 */}
      {showPromptPopup && (
        <div className="prompt-popup-overlay" onClick={closePromptPopup}>
          <div className="prompt-popup" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-header">
              <span className="prompt-title">스토리 프롬프트</span>
            </div>
            <div className="prompt-divider"></div>
            <div className="prompt-input-section">
              <textarea 
                className="prompt-textarea"
                placeholder="스토리 프롬프트를 작성하세요 ...&#10;&#10;ex) 왕비가 누군가에게 암살당한 이야기를 만들어줘"
                rows={4}
              />
            </div>
            <div className="prompt-divider"></div>
            <div className="prompt-output-section">
              <div className="prompt-output">
                왕비가 어젯밤 방에 침입한 누군가에 의해 살해당했습니다. 이는 곧 전국으로 퍼져나갔습니다.
              </div>
            </div>
            <div className="prompt-button-container">
              <button className="prompt-generate-btn">
                <span>생성하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 선택 프롬프트 팝업 */}
      {showChoicePopup && (
        <div className="prompt-popup-overlay" onClick={closeChoicePopup}>
          <div className="choice-popup" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-header">
              <span className="choice-title">선택 프롬프트</span>
            </div>
            <div className="choice-divider"></div>
            <div className="prompt-input-section">
              <textarea 
                className="choice-textarea"
                placeholder="선택 프롬프트를 작성하세요 ...&#10;&#10;ex) 왕비의 죽음을 조사할지, 범인을 직접 찾을지 선택하세요"
                rows={4}
              />
            </div>
            <div className="choice-divider"></div>
            <div className="prompt-output-section">
              <div className="choice-output">
                1. 왕비의 죽음을 공식적으로 조사한다
                2. 직접 범인을 찾아 나선다
              </div>
            </div>
            <div className="choice-button-container">
              <button className="choice-generate-btn">
                <span>생성하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스탯 프롬프트 팝업 */}
      {showStatPopup && (
        <div className="prompt-popup-overlay" onClick={closeStatPopup}>
          <div className="stat-popup" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-header">
              <span className="stat-title">스탯 프롬프트</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-description-section">
              <div className="stat-description">
                스탯 프롬프트를 작성하세요. 공란이라면, 사용자의 답변에 알맞게 자동으로 스탯이 조정됩니다.
                <br/><br/>
                ex) 세금을 인상하기로 하면 경제 관련 스탯이 비약적으로 상승하지만, 민심 관련 스탯이 하락합니다.
                <br/><br/>
                세금을 인상하지 않으면, 경제 관련 스탯이 비약적으로 하락하고, 민심은 변동이 없습니다.
              </div>
            </div>
            <div className="stat-button-container">
              <button className="stat-setting-btn">
                <span>설정하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 질문 프롬프트 팝업 */}
      {showAskPopup && (
        <div className="prompt-popup-overlay" onClick={closeAskPopup}>
          <div className="ask-popup" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-header">
              <span className="ask-title">질문 프롬프트</span>
            </div>
            <div className="ask-divider"></div>
            <div className="prompt-input-section">
              <textarea 
                className="ask-textarea"
                placeholder="질문 프롬프트를 작성하세요 ...&#10;&#10;ex) 사용자에게 다음 행동에 대해 물어봅니다"
                rows={4}
              />
            </div>
            <div className="ask-divider"></div>
            <div className="prompt-output-section">
              <div className="ask-output">
                어떤 행동을 취하시겠습니까? 신중히 선택해주세요.
              </div>
            </div>
            <div className="ask-button-container">
              <button className="ask-generate-btn">
                <span>생성하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 라우팅 프롬프트 팝업 */}
      {showRoutingPopup && (
        <div className="prompt-popup-overlay" onClick={closeRoutingPopup}>
          <div className="routing-popup" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-header">
              <span className="routing-title">라우팅 프롬프트</span>
            </div>
            <div className="routing-divider"></div>
            <div className="routing-description-section">
              <div className="routing-description">
                라우팅 프롬프트를 작성하세요. 공란이라면, 사용자의 답변에 알맞게 자동으로 다음 스토리가 연결됩니다.
                <br/><br/>
                ex) 왕을 선택하면 왕관련 스토리로, 신하를 선택하면 신하 관련 스토리로 이동합니다.
                <br/><br/>
                특정 선택을 하지 않으면, 기본 스토리로 이동합니다.
              </div>
            </div>
            <div className="routing-button-container">
              <button className="routing-setting-btn">
                <span>설정하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 질문 스탯 프롬프트 팝업 */}
      {showAskStatPopup && (
        <div className="prompt-popup-overlay" onClick={closeAskStatPopup}>
          <div className="ask-stat-popup" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-header">
              <span className="ask-stat-title">스탯 프롬프트</span>
            </div>
            <div className="ask-stat-divider"></div>
            <div className="ask-stat-description-section">
              <div className="ask-stat-description">
                질문에 대한 스탯 프롬프트를 작성하세요. 공란이라면, 사용자의 답변에 알맞게 자동으로 스탯이 조정됩니다.
                <br/><br/>
                ex) 왕을 지지한다면 권력 관련 스탯이 상승하고, 민심 관련 스탯이 하락합니다.
                <br/><br/>
                신하를 지지한다면, 민심 관련 스탯이 상승하고, 권력 관련 스탯이 하락합니다.
              </div>
            </div>
            <div className="ask-stat-button-container">
              <button className="ask-stat-setting-btn">
                <span>설정하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측 사이드바 */}
      <div className="editor-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-image"></div>
          <div className="sidebar-text">
            <div className="vintage-text">
              <span>Chronicle</span>
              <span>of</span>
              <span>Tales</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 에디터 영역 */}
      <div className="editor-main" onClick={editingNodeId ? exitEditMode : undefined}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>

      {/* 우상단 북 아이콘 */}
      <div className="editor-book-icon">
        <div className="book-icon" onClick={toggleGamePlay}></div>
      </div>

      {/* 우하단 플러스 버튼 */}
      <div className="editor-add-button">
        <button className="add-btn" onClick={toggleNodePopup}>
          <span>+</span>
        </button>
      </div>

      {/* 노드 선택 팝업 */}
      {showNodePopup && (
        <div className="node-popup">
          <div className="popup-content">
            <div className="node-button story-button" onClick={addStoryNode}>
              <span>Story</span>
            </div>
            <div className="node-button choice-button" onClick={addChoiceNode}>
              <span>Choice</span>
            </div>
            <div className="node-button ask-button" onClick={addAskNode}>
              <span>Ask</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage; 