// src/pages/GamePlayerPage.jsx
// (이전 game_player_page_jsx_v19_pre_backend_final_180300과 동일)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

const HeartIcon = () => <span className="text-red-500">♥</span>; /* ... (다른 아이콘 정의) ... */
const BrainIcon = () => <span className="text-blue-500">🧠</span>;
const SwordIcon = () => <span className="text-gray-600">⚔️</span>;
const GemIcon = () => <span className="text-purple-500">💎</span>;
const gameFontStyle = { fontFamily: "'MedievalSharp', cursive" };
const gameTitleFontStyle = { fontFamily: "'Press Start 2P', cursive" };
const initialGameData = { /* ... (이전과 동일한 가짜 데이터, choices에 label 포함) ... */ };
const fakeNextNodesData = { /* ... (이전과 동일한 가짜 데이터, choices에 label 포함) ... */};
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

  const loadGameData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const storyDetails = await new Promise(resolve => setTimeout(() => resolve({ title: `스토리 ${storyId} (Game Player)`, initial_stats: { "용기": 7, "지혜": 3, "마력": 5 } }), 100));
      const nodes = await new Promise(resolve => setTimeout(() => resolve(
        storyId === '1' ? [
          { id: '1', type: 'STORY', text_content: "어두운 숲, 모험이 시작된다!", characterName: "나레이터", imageUrl: "https://placehold.co/300x200/2D3748/E2E8F0?text=시작&font=sans", choices: [{ nextNodeId: '2', text: "계속"}] },
          { id: '2', type: 'QUESTION', text_content: "갈림길이다. 왼쪽인가, 오른쪽인가?", choices: [{ nextNodeId: '3', text: "왼쪽" }, { nextNodeId: '4', text: "오른쪽" }] },
          { id: '3', type: 'STORY', text_content: "왼쪽 길은 막다른 절벽이었다.", choices: [{ nextNodeId: '1', text: "돌아가기"}] }, // 마지막 노드는 루프 또는 종료 처리 필요
          { id: '4', type: 'QUESTION_INPUT', text_content: "스핑크스가 나타났다! \"가장 강한 마법은?\"", inputPrompt: "답변을 입력...", choices: [{ nextNodeId: '5', text:"대답하기" /* 답변에 따라 분기 로직 필요 */}] }, 
          { id: '5', type: 'STORY', text_content: "스핑크스는 만족한 듯 사라졌다.", choices: [] }, // 게임 종료 또는 다음 노드
        ] : []
      ), 200));
      
      const firstNode = nodes.find(n => n.id === '1');

      if (storyDetails) {
        setGameTitle(storyDetails.title);
        setCurrentStats(storyDetails.initial_stats || {});
      }
      if (firstNode) {
        setCurrentNode(firstNode);
      } else if (nodes.length > 0) {
        setCurrentNode(nodes[0]); // Fallback to the first node if no specific start node
      } else {
        setError("시작 노드를 찾을 수 없거나 스토리가 비어있습니다.");
      }
    } catch (err) {
      console.error("게임 데이터 로드 실패:", err);
      setError(err.message || "게임 데이터를 불러오는 데 실패했습니다.");
      setCurrentNode(null);
    }
    setIsLoading(false);
  }, [storyId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    loadGameData();
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [loadGameData]);

  useEffect(() => {
    loadGameData();
  }, [storyId, location.search, loadGameData]);

  const currentChoices = useMemo(() => {
    if (!currentNode || currentNode.type === 'QUESTION_INPUT') return [];
    return (currentNode.choices || []).filter(choice => !choice.condition || choice.condition(currentStats)).slice(0, 2);
  }, [currentNode, currentStats]);

  const goToNextNode = useCallback(async (nextNodeId, userInput = null) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const allNodes = storyId === '1' ? [
        { id: '1', type: 'STORY', text_content: "어두운 숲, 모험이 시작된다!", characterName: "나레이터", imageUrl: "https://placehold.co/300x200/2D3748/E2E8F0?text=시작&font=sans", choices: [{ nextNodeId: '2', text: "계속"}] },
        { id: '2', type: 'QUESTION', text_content: "갈림길이다. 왼쪽인가, 오른쪽인가?", choices: [{ nextNodeId: '3', text: "왼쪽" }, { nextNodeId: '4', text: "오른쪽" }] },
        { id: '3', type: 'STORY', text_content: "왼쪽 길은 막다른 절벽이었다.", choices: [{ nextNodeId: '1', text: "돌아가기"}] },
        { id: '4', type: 'QUESTION_INPUT', text_content: "스핑크스가 나타났다! \"가장 강한 마법은?\"", inputPrompt: "답변을 입력...", choices: [{ nextNodeId: '5', text:"대답하기" }] }, 
        { id: '5', type: 'STORY', text_content: "스핑크스는 만족한 듯 사라졌다.", choices: [] },
      ] : [];

    const nextNodeData = allNodes.find(n => n.id === nextNodeId);

    if (nextNodeData) {
      setCurrentNode(nextNodeData);
      setInputValue(""); 
      setCharCount(0);
    } else {
      setError(`다음 노드(${nextNodeId})를 찾을 수 없습니다.`);
    }
    setCardPosition({ x: 0, y: 0 });
    setCardRotation(0);
    setIsLoading(false);
  }, [storyId]);
  
  const processChoice = useCallback((chosenChoice) => {
    if (!chosenChoice || !chosenChoice.nextNodeId) {
      console.warn("선택지에 nextNodeId가 없습니다.", chosenChoice);
      setError("잘못된 선택지입니다.");
      return;
    }
    if (chosenChoice.stat_effects) {
      setCurrentStats(prevStats => {
        const newStats = { ...prevStats };
        for (const stat in chosenChoice.stat_effects) {
          newStats[stat] = (newStats[stat] || 0) + chosenChoice.stat_effects[stat];
        }
        return newStats;
      });
    }
    goToNextNode(chosenChoice.nextNodeId);
  }, [currentStats, goToNextNode]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setCharCount(value.length);
  };

  const handleInputSubmit = useCallback(() => {
    if (!currentNode || currentNode.type !== 'QUESTION_INPUT' || !currentNode.choices || currentNode.choices.length === 0) {
      setError("입력 제출에 필요한 정보가 부족합니다.");
      return;
    }
    const choiceForInput = currentNode.choices[0];
    goToNextNode(choiceForInput.nextNodeId, inputValue);
  }, [currentNode, inputValue, goToNextNode]);

  const bindCardDrag = useDrag(
    ({ down, movement: [mx], direction: [dx], velocity: [vx], tap, swipe: [swipeX] }) => {
      if (tap || currentNode?.type === 'QUESTION_INPUT') return;

      let currentSwipeDirection = dx > 0 ? SWIPE_DIRECTION.RIGHT : SWIPE_DIRECTION.LEFT;
      if (Math.abs(mx) > HINT_THRESHOLD) {
        setSwipeDirectionHint(currentSwipeDirection);
      } else {
        setSwipeDirectionHint(SWIPE_DIRECTION.NONE);
      }

      if (down) {
        setCardPosition({ x: mx, y: 0 });
        setCardRotation(mx / 10);
      } else {
        if (swipeX !== 0) {
          const choiceIndex = swipeX === SWIPE_DIRECTION.RIGHT ? (currentChoices.length > 1 ? 1 : 0) : 0;
          if (currentChoices[choiceIndex]) {
            setCardPosition({ x: swipeX * (window.innerWidth), y: 0 });
            setCardRotation(swipeX * 45);
            setTimeout(() => processChoice(currentChoices[choiceIndex]), 50);
          } else {
            setSwipeDirectionHint(SWIPE_DIRECTION.NONE);
            setCardPosition({ x: 0, y: 0 });
            setCardRotation(0);
          }
        } else {
          setSwipeDirectionHint(SWIPE_DIRECTION.NONE);
          setCardPosition({ x: 0, y: 0 });
          setCardRotation(0);
        }
      }
    },
    { filterTaps: true, swipe: { duration: 250, distance: SWIPE_THRESHOLD, delay: 0 } }
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isLoading || !currentNode) return;

      if (currentNode.type === 'QUESTION_INPUT') {
        if (event.key === 'Enter') {
          handleInputSubmit();
        }
      } else {
        if (event.key === 'ArrowLeft' && currentChoices[0]) {
          setCardPosition({ x: -(window.innerWidth), y: 0 });
          setCardRotation(-45);
          setTimeout(() => processChoice(currentChoices[0]), 50);
        } else if (event.key === 'ArrowRight') {
          const choiceIndex = currentChoices.length > 1 ? 1 : 0;
          if (currentChoices[choiceIndex]) {
            setCardPosition({ x: window.innerWidth, y: 0 });
            setCardRotation(45);
            setTimeout(() => processChoice(currentChoices[choiceIndex]), 50);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, currentNode, currentChoices, processChoice, handleInputSubmit]);

  const handleExitGame = () => {
    navigate(`/`);
  };

  if (isLoading && !currentNode) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-white text-2xl">로딩 중...</div>;
  if (error) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-red-500 text-xl p-4 text-center">오류: {error}</div>;
  if (!currentNode) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-gray-400 text-xl">게임을 시작할 수 없습니다.</div>;

  let leftHintText = "";
  let rightHintText = "";
  if (currentNode.type !== 'QUESTION_INPUT') {
    if (swipeDirectionHint === SWIPE_DIRECTION.LEFT && currentChoices[0]) leftHintText = currentChoices[0].label || currentChoices[0].text;
    if (swipeDirectionHint === SWIPE_DIRECTION.RIGHT) {
      if (currentChoices.length === 1 && currentChoices[0]) rightHintText = currentChoices[0].label || currentChoices[0].text;
      else if (currentChoices[1]) rightHintText = currentChoices[1].label || currentChoices[1].text;
    }
  }
  
  return (
    <div style={gameFontStyle} className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-4 sm:p-6 overflow-hidden select-none">
      <button onClick={handleExitGame} className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-white z-20" aria-label="게임 종료">✕</button>
      <div className="w-full max-w-md flex justify-around items-center p-2 sm:p-3 my-4 sm:my-6">
        {Object.entries(currentStats).map(([stat, value]) => (
          <div key={stat} className="flex flex-col items-center mx-1 sm:mx-2" title={`${stat}: ${value}`}>
            <div className="text-2xl sm:text-3xl h-8 flex items-center justify-center">{statIcons[stat] || '?'}</div>
            <div className="h-1 w-8 sm:w-12 mt-1 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${Math.max(0, Math.min(value, 10)) * 10}%` }} ></div></div>
          </div>
        ))}
      </div>
      {currentNode.characterName && (<div style={gameTitleFontStyle} className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-center">{currentNode.characterName}</div>)}
      <div className="relative w-full max-w-xs h-[28rem] sm:h-[32rem] flex items-center justify-center mb-4">
        {currentNode.type === 'QUESTION_INPUT' ? ( <motion.div key={`${currentNode.id}-input`} className="w-full h-full bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-5 flex flex-col justify-center items-center text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}> <h2 className="text-xl sm:text-2xl font-bold mb-4">{currentNode.text_content}</h2><textarea value={inputValue} onChange={handleInputChange} maxLength={100} className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none placeholder-gray-500" placeholder={currentNode.inputPrompt || "답변을 입력하세요..."}></textarea><div className="text-sm text-gray-400 mt-2">{charCount}/100</div><button onClick={handleInputSubmit} disabled={!inputValue.trim()} className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xl font-bold rounded-lg shadow-lg transition-colors duration-200">확인</button> </motion.div>
        ) : ( <>
            <AnimatePresence> {swipeDirectionHint !== SWIPE_DIRECTION.NONE && (leftHintText || rightHintText) && ( <motion.div key={swipeDirectionHint === SWIPE_DIRECTION.LEFT ? "hint-left" : "hint-right"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, transition: { duration: 0.1 } }} className={`absolute top-10 px-4 py-2 text-xl font-bold rounded-lg shadow-xl z-10 ${swipeDirectionHint === SWIPE_DIRECTION.LEFT ? 'left-4 bg-red-600 text-white -rotate-12 origin-bottom-left transform -translate-x-full' : 'right-4 bg-blue-600 text-white rotate-12 origin-bottom-right transform translate-x-full'}`}> {swipeDirectionHint === SWIPE_DIRECTION.LEFT ? leftHintText : rightHintText} </motion.div> )} </AnimatePresence>
            <AnimatePresence mode="wait"> {currentNode && currentNode.id && ( <motion.div key={currentNode.id} {...bindCardDrag()} className="absolute w-[19rem] h-[28rem] sm:w-80 sm:h-[32rem] bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-5 cursor-grab flex flex-col justify-between items-center text-center" style={{ touchAction: 'none' }} initial={{ scale: 0.8, opacity: 0, y: 60 }} animate={{ x: cardPosition.x, y: cardPosition.y, rotate: cardRotation, scale: 1, opacity: 1 }} exit={{ x: cardPosition.x + (cardPosition.x === 0 ? 0 : (cardPosition.x > 0 ? 250 : -250)), opacity: 0, scale: 0.7, transition: { duration: 0.35 } }} transition={{ type: "spring", stiffness: 280, damping: 25 }}> <div className="w-full flex-shrink-0 mb-3"><img src={currentNode.imageUrl || `https://placehold.co/300x180/${currentNode.id === '1' ? '2D3748' : '4A5568'}/E2E8F0?text=${encodeURIComponent(currentNode.label || '장면')}&font=sans`} alt={currentNode.label || "게임 장면"} className="w-full h-40 sm:h-48 object-cover rounded-lg shadow-md" onError={(e) => { e.currentTarget.src = `https://placehold.co/300x180/718096/E2E8F0?text=이미지없음&font=sans`; e.currentTarget.alt = '이미지 로드 실패';}} /></div><p className="text-lg sm:text-xl leading-relaxed my-auto overflow-y-auto max-h-32 sm:max-h-40 px-2">{currentNode.text_content}</p><div className="w-full mt-auto pt-3 border-t border-gray-700"><div className="grid grid-cols-2 gap-3"> {currentChoices.map((choice, index) => ( <button key={choice.nextNodeId || index} onClick={() => processChoice(choice)} className={`w-full py-3 px-2 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md ${index === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}> {choice.label || choice.text} </button> ))}</div></div> </motion.div> )} </AnimatePresence>
          </>
        )}
      </div>
      <div style={gameTitleFontStyle} className="text-sm text-gray-500 mt-auto mb-2">{gameTitle}</div>
    </div>
  );
}
export default GamePlayerPage;
