import React, { useCallback, useState, useRef, useEffect } from 'react';
import './GamePlayPage.css';

interface GamePlayPageProps {
  onBack?: () => void;
}

interface Stat {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  color: string;
}

interface StoryNode {
  id: string;
  content: string;
  isActive: boolean;
  type: 'story' | 'choice' | 'ask';
  choices?: {
    left: string;
    right: string;
  };
  question?: string;
  // 연결 정보 (엣지)
  edges?: {
    left?: string; // 왼쪽 선택 시 연결될 노드 ID
    right?: string; // 오른쪽 선택 시 연결될 노드 ID
    next?: string; // 기본 다음 노드 ID (스토리/Ask 노드용)
  };
}

const GamePlayPage: React.FC<GamePlayPageProps> = ({ onBack }) => {
  const [stats, setStats] = useState<Stat[]>([
    { id: '1', name: '스탯 1', value: 70, maxValue: 100, color: '#A71919' },
    { id: '2', name: '스탯 2', value: 37, maxValue: 100, color: '#FFFF00' },
    { id: '3', name: '스탯 3', value: 65, maxValue: 100, color: '#002A54' },
  ]);

  // 노드 그래프 정의
  const [nodeGraph] = useState<Record<string, StoryNode>>({
    'start': {
      id: 'start',
      content: '왕비가 어젯밤 방에 침입한 누군가에 의해 살해당했습니다. 이는 곧 전국으로 퍼져나갔습니다. 당신은 이 상황을 어떻게 처리하시겠습니까?',
      isActive: true,
      type: 'story',
      edges: { next: 'choice1' }
    },
    'choice1': {
      id: 'choice1',
      content: '궁정을 조사할지, 아니면 신하들을 소집할지 결정해야 합니다.',
      isActive: true,
      type: 'choice',
      choices: {
        left: '궁정 조사',
        right: '신하 소집',
      },
      edges: { left: 'investigation', right: 'assembly' }
    },
    'investigation': {
      id: 'investigation',
      content: '궁정 조사를 시작했습니다. 의심스러운 흔적들이 발견되었습니다.',
      isActive: true,
      type: 'story',
      edges: { next: 'ask1' }
    },
    'assembly': {
      id: 'assembly',
      content: '신하들을 소집했습니다. 모두들 긴장한 표정을 짓고 있습니다.',
      isActive: true,
      type: 'story',
      edges: { next: 'choice2' }
    },
    'ask1': {
      id: 'ask1',
      content: '수상한 흔적을 발견했습니다. 이에 대해 백성들에게 어떤 메시지를 전달하시겠습니까?',
      isActive: true,
      type: 'ask',
      question: '백성들에게 전할 메시지를 입력하세요',
      edges: { next: 'choice2' }
    },
    'choice2': {
      id: 'choice2',
      content: '이제 추가 조치를 결정해야 합니다. 경비를 강화할지, 아니면 공개 수사를 진행할지 선택하세요.',
      isActive: true,
      type: 'choice',
      choices: {
        left: '경비 강화',
        right: '공개 수사',
      },
      edges: { left: 'security', right: 'public_investigation' }
    },
    'security': {
      id: 'security',
      content: '궁궐 경비를 대폭 강화했습니다. 백성들은 안전하다고 느끼지만 긴장감이 고조되고 있습니다.',
      isActive: true,
      type: 'story',
      edges: { next: 'end1' }
    },
    'public_investigation': {
      id: 'public_investigation',
      content: '공개적으로 수사를 진행하기로 했습니다. 투명성은 높아졌지만 정치적 파장이 예상됩니다.',
      isActive: true,
      type: 'story',
      edges: { next: 'ask2' }
    },
    'ask2': {
      id: 'ask2',
      content: '공개 수사로 인해 정치적 갈등이 심화되고 있습니다. 이 상황을 어떻게 수습하시겠습니까?',
      isActive: true,
      type: 'ask',
      question: '상황 수습 방안을 입력하세요',
      edges: { next: 'end2' }
    },
    'end1': {
      id: 'end1',
      content: '강화된 보안으로 왕국은 안정을 되찾았습니다. 하지만 자유로운 분위기는 사라졌습니다.',
      isActive: true,
      type: 'story',
      edges: {} // 엔딩 노드
    },
    'end2': {
      id: 'end2',
      content: '투명한 수사와 적절한 대응으로 왕국은 더 강해졌습니다. 백성들의 신뢰를 얻었습니다.',
      isActive: true,
      type: 'story',
      edges: {} // 엔딩 노드
    }
  });

  const [currentStory, setCurrentStory] = useState<StoryNode>(nodeGraph['start']);
  const [storyHistory, setStoryHistory] = useState<StoryNode[]>([]);
  
  // 스와이프 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<'left' | 'right' | null>(null);
  
  // Ask node 관련 상태
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // 노드 네비게이션 함수
  const navigateToNode = useCallback((nodeId: string | undefined) => {
    if (!nodeId || !nodeGraph[nodeId]) {
      console.log('스토리 종료 - 연결된 노드가 없습니다.');
      return;
    }

    const nextNode = nodeGraph[nodeId];
    setStoryHistory(prev => [...prev, currentStory]);
    setCurrentStory(nextNode);
    
    // 상태 초기화
    setDragOffset(0);
    setSelectedChoice(null);
    setIsDragging(false);
    setUserAnswer('');
  }, [nodeGraph, currentStory]);

  const handleStoryClick = useCallback(() => {
    console.log('스토리 카드 클릭됨!');
    
    // 엣지 연결을 따라 다음 노드로 이동
    const nextNodeId = currentStory.edges?.next;
    navigateToNode(nextNodeId);

    // 스탯 변화 시뮬레이션
    setStats(prev => prev.map(stat => ({
      ...stat,
      value: Math.max(0, Math.min(100, stat.value + (Math.random() - 0.5) * 20))
    })));
  }, [currentStory, navigateToNode]);

  const handleChoiceSelect = useCallback((choice: 'left' | 'right') => {
    console.log(`선택됨: ${choice}`);
    
    // 엣지 연결을 따라 선택에 따른 노드로 이동
    const nextNodeId = choice === 'left' 
      ? currentStory.edges?.left 
      : currentStory.edges?.right;
    
    navigateToNode(nextNodeId);

    // 선택에 따른 스탯 변화
    setStats(prev => prev.map(stat => {
      let change = 0;
      if (choice === 'left') {
        // 왼쪽 선택 (보통 보수적 선택)
        if (stat.id === '1') change = 10; // 권력 증가
        if (stat.id === '2') change = -5; // 경제 약간 감소
        if (stat.id === '3') change = 5; // 민심 약간 증가
      } else {
        // 오른쪽 선택 (보통 진보적 선택)
        if (stat.id === '1') change = 5; // 권력 약간 증가
        if (stat.id === '2') change = -10; // 경제 감소
        if (stat.id === '3') change = 15; // 민심 크게 증가
      }
      
      return {
        ...stat,
        value: Math.max(0, Math.min(100, stat.value + change))
      };
    }));
  }, [currentStory, navigateToNode]);

  // 스와이프 시작 (마우스/터치)
  const handleDragStart = useCallback((clientX: number) => {
    if (currentStory.type !== 'choice') return;
    
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
  }, [currentStory.type]);

  // 스와이프 중 (마우스/터치)
  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStartX;
    const maxOffset = 100; // 최대 드래그 거리
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    
    setDragOffset(clampedOffset);
    
    // 선택 미리보기
    if (Math.abs(clampedOffset) > 30) {
      setSelectedChoice(clampedOffset > 0 ? 'right' : 'left');
    } else {
      setSelectedChoice(null);
    }
  }, [isDragging, dragStartX]);

  // 스와이프 끝 (마우스/터치)
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    // 충분히 드래그했으면 선택 처리
    if (Math.abs(dragOffset) > 50) {
      const choice = dragOffset > 0 ? 'right' : 'left';
      handleChoiceSelect(choice);
    } else {
      // 아니면 원래 위치로 복귀
      setDragOffset(0);
      setSelectedChoice(null);
    }
    
    setIsDragging(false);
  }, [isDragging, dragOffset, handleChoiceSelect]);

  // 마우스 이벤트
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // 터치 이벤트
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Ask node 답변 제출
  const handleAskSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    console.log('사용자 답변:', userAnswer);

    setTimeout(() => {
      // 엣지 연결을 따라 다음 노드로 이동
      const nextNodeId = currentStory.edges?.next;
      
      // 답변에 따른 스탯 변화
      setStats(prev => prev.map(stat => {
        let change = 0;
        const answerLength = userAnswer.length;
        const isPositive = userAnswer.includes('안전') || userAnswer.includes('정의') || userAnswer.includes('평화') || userAnswer.includes('신뢰');
        const isNegative = userAnswer.includes('처벌') || userAnswer.includes('엄벌') || userAnswer.includes('강력');
        
        if (stat.id === '1') { // 권력
          change = isNegative ? 20 : (isPositive ? 10 : 0);
        }
        if (stat.id === '2') { // 경제  
          change = answerLength > 30 ? -10 : (answerLength > 15 ? -5 : 5);
        }
        if (stat.id === '3') { // 민심
          change = isPositive ? 25 : (isNegative ? -15 : 0);
        }
        
        return {
          ...stat,
          value: Math.max(0, Math.min(100, stat.value + change))
        };
      }));

      // 다음 노드로 이동
      navigateToNode(nextNodeId);
      setIsSubmitting(false);
    }, 1000);
  }, [userAnswer, isSubmitting, currentStory, navigateToNode]);

  const handleBackToEditor = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  return (
    <div className="gameplay-page">
      {/* 메인 게임 컨테이너 */}
      <div className="gameplay-container">
        {/* 스탯 영역 */}
        <div className="stats-section">
          {stats.map((stat) => (
            <div key={stat.id} className="stat-item">
              <div className="stat-label">{stat.name}</div>
              <div className="stat-bar-container">
                <div className="stat-bar-background">
                  <div 
                    className="stat-bar-fill"
                    style={{
                      width: `${(stat.value / stat.maxValue) * 100}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 스토리 카드, 선택 카드, 또는 질문 카드 */}
        {currentStory.type === 'story' ? (
          <div 
            className="story-card"
            onClick={handleStoryClick}
          >
            <div className="story-content">
              <p className="story-text">{currentStory.content}</p>
            </div>
          </div>
        ) : currentStory.type === 'choice' ? (
          <div className="choice-card-container">
            <div 
              ref={cardRef}
              className={`choice-card ${isDragging ? 'dragging' : ''} ${selectedChoice ? `selected-${selectedChoice}` : ''}`}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.2}deg)`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="choice-content">
                <p className="choice-text">{currentStory.content}</p>
              </div>
              <div className="choice-indicators">
                <div className={`choice-indicator left ${selectedChoice === 'left' ? 'active' : ''}`}>
                  <span>← {currentStory.choices?.left}</span>
                </div>
                <div className={`choice-indicator right ${selectedChoice === 'right' ? 'active' : ''}`}>
                  <span>{currentStory.choices?.right} →</span>
                </div>
              </div>
            </div>
            <div className="swipe-hint">좌우로 드래그하여 선택하세요</div>
          </div>
        ) : (
          <div className="ask-card-container">
            <div className="ask-card">
              <div className="ask-content">
                <p className="ask-text">{currentStory.content}</p>
              </div>
              <form className="ask-input-section" onSubmit={handleAskSubmit}>
                <div className="ask-input-container">
                  <textarea
                    className="ask-textarea"
                    placeholder={currentStory.question || "답변을 입력하세요"}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                  />
                  <button 
                    type="submit" 
                    className={`ask-submit-btn ${isSubmitting ? 'submitting' : ''}`}
                    disabled={!userAnswer.trim() || isSubmitting}
                  >
                    {isSubmitting ? '전송 중...' : '답변하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 돌아가기 버튼 (에디터로) */}
      <div className="gameplay-back-button">
        <button className="back-btn" onClick={handleBackToEditor}>
          <span>📝</span>
        </button>
      </div>

      {/* 디버그 패널 - 노드 연결 정보 */}
      <div className="debug-panel">
        <div className="debug-info">
          <h4>현재 노드: {currentStory.id}</h4>
          <p>타입: {currentStory.type}</p>
          {currentStory.edges && (
            <div className="edges-info">
              <strong>연결:</strong>
              {currentStory.edges.left && <span className="edge">←{currentStory.edges.left}</span>}
              {currentStory.edges.right && <span className="edge">{currentStory.edges.right}→</span>}
              {currentStory.edges.next && <span className="edge">다음:{currentStory.edges.next}</span>}
            </div>
          )}
          <div className="history">
            <strong>히스토리:</strong> {storyHistory.map(h => h.id).join(' → ')}
            {storyHistory.length > 0 && ' → '}{currentStory.id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlayPage; 