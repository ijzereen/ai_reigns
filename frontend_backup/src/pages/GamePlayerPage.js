// src/pages/GamePlayerPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // PanInfo는 사용하지 않으므로 제거
import { useDrag } from '@use-gesture/react';

// (아이콘, 폰트 스타일, 가짜 데이터는 이전 버전과 동일하게 유지)
// ... (HeartIcon, BrainIcon, SwordIcon, GemIcon, gameFontStyle, gameTitleFontStyle, initialGameData, fakeNextNodesData, statIcons, SWIPE_DIRECTION, SWIPE_THRESHOLD, HINT_THRESHOLD 정의 부분) ...
const HeartIcon = () => <span className="text-red-500">♥</span>;
const BrainIcon = () => <span className="text-blue-500">🧠</span>;
const SwordIcon = () => <span className="text-gray-600">⚔️</span>;
const GemIcon = () => <span className="text-purple-500">💎</span>;
const gameFontStyle = { fontFamily: "'MedievalSharp', cursive" };
const gameTitleFontStyle = { fontFamily: "'Press Start 2P', cursive" };
const initialGameData = {
  storyTitle: "마법사의 탑",
  currentNode: {
    id: 'node-start', type: 'STORY', characterName: "의문의 노인", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=노인+실루엣",
    text_content: "탑의 문지기가 그대를 막아선다. \"탑에 들어가려면 나의 시험을 통과해야 하네.\"",
    choices: [ { text: "시험에 도전한다", next_node_id: 'node-test-start', stat_effects: { "용기": 1 }, label: "도전!" }, { text: "다른 길을 찾는다", next_node_id: 'node-find-another-way', stat_effects: { "지혜": 1 }, label: "다른 길..." }, ],
  },
  currentStats: { "용기": 5, "지혜": 5, "마력": 2, "금화": 10 }
};
const fakeNextNodesData = {
  'node-start': initialGameData.currentNode,
  'node-test-start': { id: 'node-test-start', type: 'STORY', characterName: "문지기", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=문지기+시험", text_content: "좋다, 용감한 자여! 첫 번째 시험은 수수께끼다. '아침에는 네 발, 점심에는 두 발, 저녁에는 세 발인 것은?'", choices: [ { text: "인간", next_node_id: 'node-test-success', stat_effects: { "지혜": 2 }, label: "인간이다!" }, { text: "모르겠다", next_node_id: 'node-riddle-fail-ask-name', stat_effects: { "용기": -1 }, label: "모르겠다..." } ] },
  'node-riddle-fail-ask-name': { id: 'node-riddle-fail-ask-name', type: 'QUESTION_INPUT', characterName: "문지기", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=문지기+질문", text_content: "수수께끼는 틀렸지만, 그대의 이름이라도 알려주겠나? 나의 기록에 남겨야 하니 말일세.", inputPrompt: "그대의 이름은 무엇인가...", maxLength: 20, choices: [ { text: "이름을 말한다", next_node_id: 'node-name-received', label: "이름 말하기", llm_routing_prompt: "사용자가 이름을 입력하면 이쪽으로" } ] },
  'node-name-received': { id: 'node-name-received', type: 'STORY', characterName: "문지기", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=문지기+반응", text_content: (userInput) => `"${userInput}"이라... 흥미로운 이름이군. 기억해두겠네. 아직 탑에 들어갈 준비는 안 된 듯하니, 다시 도전하게.`, choices: [ { text: "다시 도전한다", next_node_id: 'node-start', label: "재도전" } ] },
  'node-find-another-way': { id: 'node-find-another-way', type: 'STORY', characterName: "수상한 상인", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=상인+등장", text_content: "탑 뒤편에서 한 상인이 비밀 통로를 알려주겠다며 금화 5개를 요구한다.", choices: [ { text: "금화 5개를 준다", next_node_id: 'node-pay-merchant', stat_effects: { "금화": -5 }, condition: (stats) => stats["금화"] >= 5, label: "거래한다" }, { text: "거절한다", next_node_id: 'node-refuse-merchant', label: "거절!" } ] },
  'node-test-success': { id: 'node-test-success', type: 'STORY', characterName: "문지기", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=시험+통과", text_content: "정답이다! 그대의 지혜에 감탄했네. 탑으로 들어가도 좋다.", choices: [ { text: "탑으로 들어간다", next_node_id: 'node-enter-tower', label: "입장!" } ] },
  'node-pay-merchant': { id: 'node-pay-merchant', type: 'STORY', characterName: "상인", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=비밀+통로", text_content: "상인은 흡족해하며 탑의 지하로 이어지는 비밀 통로를 알려주었다.", choices: [ { text: "지하 통로로 간다", next_node_id: 'node-secret-passage', label: "가자!" } ] },
  'node-refuse-merchant': { id: 'node-refuse-merchant', type: 'STORY', characterName: "상인", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=상인+실망", text_content: "상인은 아쉽다는 듯 어깨를 으쓱하고는 어둠 속으로 사라졌다.", choices: [ { text: "다시 정문으로", next_node_id: 'node-start', label: "돌아가기" } ] },
  'node-enter-tower': { id: 'node-enter-tower', type: 'STORY', characterName: "탑 내부", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=탑+내부", text_content: "탑 안은 고요하고 신비로운 분위기가 감돈다. 무엇을 먼저 탐색할까?", choices: [{text: "중앙 제단", next_node_id: 'node-start', label: "제단"}, {text: "오른쪽 복도", next_node_id: 'node-start', label: "복도"}]},
  'node-secret-passage': { id: 'node-secret-passage', type: 'STORY', characterName: "비밀 통로", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=어두운+통로", text_content: "비밀 통로는 어둡고 축축하다. 조심스럽게 나아가자.", choices: [{text: "계속 전진", next_node_id: 'node-enter-tower', label: "전진"}]}
};
const statIcons = { "용기": <SwordIcon />, "지혜": <BrainIcon />, "마력": <GemIcon />, "금화": <span className="text-yellow-400">$</span>, "생존": <HeartIcon /> };
const SWIPE_DIRECTION = { LEFT: -1, RIGHT: 1, NONE: 0 };
const SWIPE_THRESHOLD = 60;
const HINT_THRESHOLD = 10;


function GamePlayerPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [gameTitle, setGameTitle] = useState('');
  const [currentNode, setCurrentNode] = useState(null);
  const [currentStats, setCurrentStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [cardRotation, setCardRotation] = useState(0);
  const [swipeDirectionHint, setSwipeDirectionHint] = useState(SWIPE_DIRECTION.NONE);
  const [inputValue, setInputValue] = useState("");
  const [charCount, setCharCount] = useState(0);

  const currentChoices = useMemo(() => {
    if (!currentNode || !currentNode.choices || currentNode.type === 'QUESTION_INPUT') return [];
    return currentNode.choices.filter(choice => !choice.condition || choice.condition(currentStats)).slice(0, 2);
  }, [currentNode, currentStats]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  useEffect(() => {
    if (storyId) {
      setIsLoading(true);
      setError('');
      setInputValue("");
      setCharCount(0);
      const queryParams = new URLSearchParams(location.search);
      const startNodeIdFromQuery = queryParams.get('startNode');
      
      setTimeout(() => {
        let startingNodeId = startNodeIdFromQuery || 'node-start';
        let gameDataToLoad = fakeNextNodesData[startingNodeId];

        if (!gameDataToLoad) {
          startingNodeId = 'node-start';
          gameDataToLoad = fakeNextNodesData[startingNodeId];
        }
        
        if (gameDataToLoad) {
          setGameTitle(initialGameData.storyTitle);
          setCurrentNode(gameDataToLoad);
          setCurrentStats(initialGameData.currentStats);
          setCardPosition({ x: 0, y: 0 });
          setCardRotation(0);
        } else {
          setError("게임 시작 데이터를 불러올 수 없습니다.");
        }
        setIsLoading(false);
      }, 300);
    } else {
      navigate('/');
    }
  }, [storyId, navigate, location.search]);

  const goToNextNode = useCallback((nextNodeId, userInput = null) => {
    setIsLoading(true);
    setTimeout(() => {
      let nextNodeData = fakeNextNodesData[nextNodeId];
      if (nextNodeData) {
        if (typeof nextNodeData.text_content === 'function') {
            nextNodeData = { ...nextNodeData, text_content: nextNodeData.text_content(userInput) };
        }
        setCurrentNode(nextNodeData);
        setCardPosition({ x: 0, y: 0 });
        setCardRotation(0);
        setInputValue("");
        setCharCount(0);
      } else {
        setCurrentNode({
          id: 'node-end-fallback', type: 'STORY', characterName: "시스템",
          text_content: "다음 이야기를 찾을 수 없습니다.", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=오류",
          choices: []
        });
      }
      setIsLoading(false);
    }, 350);
  }, []);


  const processChoice = useCallback((chosenChoice) => {
    if (!chosenChoice || !chosenChoice.next_node_id) {
      setCurrentNode({
          id: 'node-end-final', type: 'STORY', characterName: "시스템",
          text_content: "모험이 끝났습니다.", imageUrl: "https://placehold.co/300x200/333/fff?text=게임+종료",
          choices: []
      });
      return;
    }
    
    let updatedStats = { ...currentStats };
    if (chosenChoice.stat_effects) {
      for (const stat in chosenChoice.stat_effects) {
        updatedStats[stat] = (updatedStats[stat] || 0) + chosenChoice.stat_effects[stat];
        if (updatedStats[stat] <= 0 && (stat === "용기" || stat === "지혜" || stat === "생존" || stat === "금화")) {
             setCurrentNode({
                id: `node-gameover-${stat}-low`, type: 'STORY', characterName: "운명",
                text_content: `${stat}(이)가 바닥났습니다... 당신의 이야기는 여기서 끝입니다.`,
                imageUrl: `https://placehold.co/300x200/222/fff?text=${stat}+고갈!`,
                choices: []
            });
            return;
        }
      }
      setCurrentStats(updatedStats);
    }
    goToNextNode(chosenChoice.next_node_id);
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [currentStats, currentNode, goToNextNode]); // currentNode 의존성 유지

  const handleInputChange = (event) => {
    const currentInput = event.target.value;
    const maxLength = currentNode?.maxLength || 100;
    if (currentInput.length <= maxLength) {
      setInputValue(currentInput);
      setCharCount(currentInput.length);
    }
  };
  
  // handleInputSubmit을 useCallback으로 감싸고 의존성 배열 명시
  const handleInputSubmit = useCallback(() => {
    if (!currentNode || currentNode.type !== 'QUESTION_INPUT' ) return;
    
    // QUESTION_INPUT 노드의 choices는 이제 LLM 라우팅을 위한 엣지 정보를 담고 있음
    const outgoingEdges = currentNode.choices || []; 
    if (outgoingEdges.length > 0 && outgoingEdges[0].next_node_id) {
        // TODO: LLM 연동 시 inputValue와 각 엣지의 llm_routing_prompt를 사용해 다음 노드 결정
        // 현재는 첫 번째 엣지로 무조건 진행
        console.log(`주관식 답변 제출: "${inputValue}", 다음 노드 ID (첫번째 엣지): ${outgoingEdges[0].next_node_id}`);
        goToNextNode(outgoingEdges[0].next_node_id, inputValue.trim());
    } else {
        console.warn("주관식 답변 후 다음 노드를 찾을 수 없습니다. (연결된 엣지 없음)");
        setCurrentNode({
          id: 'node-end-fallback', type: 'STORY', characterName: "시스템",
          text_content: "답변은 잘 받았으나, 다음 이야기로 이어지지 못했습니다.", imageUrl: "https://placehold.co/300x200/4A5568/E2E8F0?text=오류",
          choices: []
        });
    }
  }, [currentNode, inputValue, goToNextNode]);

  const bindCardDrag = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx], tap, swipe: [swipeX] }) => {
    if (isLoading || !currentNode || currentNode.type === 'QUESTION_INPUT' || currentChoices.length === 0 || tap) return;
    
    if (down) {
      setCardPosition({ x: mx, y: 0 });
      setCardRotation(mx / 15);
      if (mx < -HINT_THRESHOLD) {
        setSwipeDirectionHint(SWIPE_DIRECTION.LEFT);
      } else if (mx > HINT_THRESHOLD) {
        setSwipeDirectionHint(SWIPE_DIRECTION.RIGHT);
      } else {
        setSwipeDirectionHint(SWIPE_DIRECTION.NONE);
      }
    } else {
      setSwipeDirectionHint(SWIPE_DIRECTION.NONE);
      if (((!down && (Math.abs(mx) > SWIPE_THRESHOLD))) || (Math.abs(swipeX) === 1)) {
        const finalSwipeDir = swipeX !== 0 ? (swipeX < 0 ? SWIPE_DIRECTION.LEFT : SWIPE_DIRECTION.RIGHT) 
                                           : (mx < 0 ? SWIPE_DIRECTION.LEFT : SWIPE_DIRECTION.RIGHT);
        
        const chosenIndex = (finalSwipeDir === SWIPE_DIRECTION.LEFT) ? 0 : 
                            (currentChoices.length > 1 ? 1 : 0);

        if (currentChoices[chosenIndex]) {
          setCardPosition({ x: (finalSwipeDir * (window.innerWidth / 1.5)) / (vx > 1 ? 1 : 1.5) , y: 0 });
          setCardRotation(finalSwipeDir * 20);
          processChoice(currentChoices[chosenIndex]);
        } else {
          setCardPosition({ x: 0, y: 0 });
          setCardRotation(0);
        }
      } else {
        setCardPosition({ x: 0, y: 0 });
        setCardRotation(0);
      }
    }
  }, { filterTaps: true, swipe: { duration: 250, distance: SWIPE_THRESHOLD, delay: 0 } });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
        if (event.key === 'Enter' && currentNode && currentNode.type === 'QUESTION_INPUT' && !event.shiftKey) {
            event.preventDefault();
            handleInputSubmit();
        }
        return;
      }

      if (isLoading || !currentNode || currentNode.type === 'QUESTION_INPUT' || currentChoices.length === 0) return;
      
      let choiceToProcess = null;
      let directionForAnimation = SWIPE_DIRECTION.NONE;

      if (event.key === 'ArrowLeft' && currentChoices[0]) {
        choiceToProcess = currentChoices[0];
        directionForAnimation = SWIPE_DIRECTION.LEFT;
      } else if (event.key === 'ArrowRight' && currentChoices[1]) {
        choiceToProcess = currentChoices[1];
        directionForAnimation = SWIPE_DIRECTION.RIGHT;
      } else if (event.key === 'ArrowRight' && currentChoices.length === 1 && currentChoices[0]) {
        choiceToProcess = currentChoices[0];
        directionForAnimation = SWIPE_DIRECTION.RIGHT;
      }

      if (choiceToProcess) {
        setCardPosition({ x: (directionForAnimation * window.innerWidth) / 1.5 , y: 0 });
        setCardRotation(directionForAnimation * 20);
        processChoice(choiceToProcess);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, currentNode, currentChoices, processChoice, handleInputSubmit]);

  const handleExitGame = () => {
    const cameFromEditor = location.state?.fromEditor;
    if (cameFromEditor && storyId) {
      navigate(`/editor/${storyId}`);
    } else {
      navigate('/');
    }
  };

  if (isLoading && !currentNode) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-white text-2xl">로딩 중...</div>;
  if (error) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-red-500 text-xl p-4 text-center">오류: {error}</div>;
  if (!currentNode) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-gray-400 text-xl">게임을 시작할 수 없습니다.</div>;

  let leftHintText = "";
  let rightHintText = "";
  if (currentNode.type !== 'QUESTION_INPUT') {
    if (swipeDirectionHint === SWIPE_DIRECTION.LEFT && currentChoices[0]) {
      leftHintText = currentChoices[0].label || currentChoices[0].text; // .label (엣지 레이블) 우선 사용
    }
    if (swipeDirectionHint === SWIPE_DIRECTION.RIGHT) {
      if (currentChoices.length === 1 && currentChoices[0]) {
        rightHintText = currentChoices[0].label || currentChoices[0].text; // .label 우선 사용
      } else if (currentChoices[1]) {
        rightHintText = currentChoices[1].label || currentChoices[1].text; // .label 우선 사용
      }
    }
  }
  
  return (
    <div style={gameFontStyle} className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-4 sm:p-6 overflow-hidden select-none">
      <button 
        onClick={handleExitGame}
        className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-white transition-colors z-20"
        aria-label="게임 종료"
      >
        ✕
      </button>

      <div className="w-full max-w-md flex justify-around items-center p-2 sm:p-3 my-4 sm:my-6">
        {Object.entries(currentStats).map(([stat, value]) => (
          <div key={stat} className="flex flex-col items-center mx-1 sm:mx-2" title={`${stat}: ${value}`}>
            <div className="text-2xl sm:text-3xl h-8 flex items-center justify-center">{statIcons[stat] || '?'}</div>
            <div className="h-1 w-8 sm:w-12 mt-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300 ease-out" 
                style={{ width: `${Math.max(0, Math.min(value, 10)) * 10}%` }} 
              ></div>
            </div>
          </div>
        ))}
      </div>

      {currentNode.characterName && (
        <div style={gameTitleFontStyle} className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-center">
          {currentNode.characterName}
        </div>
      )}

      <div className="relative w-full max-w-xs h-[28rem] sm:h-[32rem] flex items-center justify-center mb-4">
        {currentNode.type === 'QUESTION_INPUT' ? (
          <motion.div
            key={`${currentNode.id}-input`}
            className="w-full h-full bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-5 flex flex-col justify-center items-center text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentNode.imageUrl && (
              <div className="w-full h-36 sm:h-48 mb-3 sm:mb-4 rounded-md overflow-hidden bg-gray-700">
                <img src={currentNode.imageUrl} alt={currentNode.characterName || "질문 이미지"} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; if(e.currentTarget.parentElement) e.currentTarget.parentElement.style.display='none';}}/>
              </div>
            )}
            <p className="text-lg sm:text-xl leading-normal text-gray-100 mb-4 px-1">
              {currentNode.text_content}
            </p>
            <div className="w-full">
              <textarea
                style={gameFontStyle}
                className="w-full p-3 text-lg bg-gray-700 border-2 border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none shadow-inner"
                rows="3"
                placeholder={currentNode.inputPrompt || "여기에 답변을 입력하세요..."}
                value={inputValue}
                onChange={handleInputChange}
                maxLength={currentNode.maxLength || 100}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInputSubmit();
                  }
                }}
              />
              <div className="text-right text-xs text-gray-400 mt-1 pr-1">
                {charCount} / {currentNode.maxLength || 100}
              </div>
            </div>
            <button
              onClick={handleInputSubmit}
              disabled={isLoading || inputValue.trim() === ""}
              style={gameTitleFontStyle}
              className="mt-4 w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-150 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "전송 중..." : "답변하기"}
            </button>
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              {swipeDirectionHint !== SWIPE_DIRECTION.NONE && (leftHintText || rightHintText) && (
                <motion.div
                  key={swipeDirectionHint === SWIPE_DIRECTION.LEFT ? "hint-left" : "hint-right"}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, transition: { duration: 0.1 } }}
                  className={`absolute top-10 px-4 py-2 text-xl font-bold rounded-lg shadow-xl z-10 ${swipeDirectionHint === SWIPE_DIRECTION.LEFT ? 'left-4 bg-red-600 text-white -rotate-12 origin-bottom-left transform -translate-x-full' : 'right-4 bg-blue-600 text-white rotate-12 origin-bottom-right transform translate-x-full'}`}
                >
                  {swipeDirectionHint === SWIPE_DIRECTION.LEFT ? leftHintText : rightHintText}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {currentNode && currentNode.id && (
                <motion.div
                  key={currentNode.id} {...bindCardDrag()}
                  className="absolute w-[19rem] h-[28rem] sm:w-80 sm:h-[32rem] bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-5 cursor-grab flex flex-col justify-between items-center text-center"
                  style={{ touchAction: 'none' }}
                  initial={{ scale: 0.8, opacity: 0, y: 60 }}
                  animate={{ x: cardPosition.x, y: cardPosition.y, rotate: cardRotation, scale: 1, opacity: 1 }}
                  exit={{ x: cardPosition.x + (cardPosition.x === 0 ? 0 : (cardPosition.x > 0 ? 250 : -250)), opacity: 0, scale: 0.7, transition: { duration: 0.35 } }}
                  transition={{ type: "spring", stiffness: 280, damping: 25 }}
                >
                  {currentNode.imageUrl && (
                    <div className="w-full h-36 sm:h-48 mb-3 sm:mb-4 rounded-md overflow-hidden bg-gray-700">
                      <img src={currentNode.imageUrl} alt={currentNode.characterName || "상황 이미지"} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; if(e.currentTarget.parentElement) e.currentTarget.parentElement.style.display='none';}}/>
                    </div>
                  )}
                  <div className="flex-grow overflow-y-auto text-lg sm:text-xl leading-normal text-gray-100 px-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
                    {currentNode.text_content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <div style={gameTitleFontStyle} className="text-sm text-gray-500 mt-auto mb-2">
        {gameTitle}
      </div>
    </div>
  );
}

export default GamePlayerPage;
