// src/pages/GamePlayerPage.jsx
// (이전 game_player_page_jsx_v19_pre_backend_final_180300과 동일)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { storyService } from '../services/storyService'; // Import storyService
// Import the transformer if proceedGame returns raw backend node data
import { transformNodeForFrontend } from '../services/storyService';

const HeartIcon = () => <span className="text-red-500">♥</span>; /* ... (다른 아이콘 정의) ... */
const BrainIcon = () => <span className="text-blue-500">🧠</span>;
const SwordIcon = () => <span className="text-gray-600">⚔️</span>;
const GemIcon = () => <span className="text-purple-500">💎</span>;
const gameFontStyle = { fontFamily: "'MedievalSharp', cursive" };
const gameTitleFontStyle = { fontFamily: "'Press Start 2P', cursive" };
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
  const [allNodes, setAllNodes] = useState([]); // To store all nodes of the story
  const [allEdges, setAllEdges] = useState([]); // To store all edges of the story
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [cardRotation, setCardRotation] = useState(0);
  const [swipeDirectionHint, setSwipeDirectionHint] = useState(SWIPE_DIRECTION.NONE);
  const [inputValue, setInputValue] = useState("");
  const [charCount, setCharCount] = useState(0);

  const loadGameData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setIsGameOver(false);
    setFinalMessage('');
    try {
      const storyDetail = await storyService.getStoryDetail(storyId);
      
      if (storyDetail) {
        setGameTitle(storyDetail.title || `스토리 ${storyId}`);
        setCurrentStats(storyDetail.initial_stats || {});
        setAllNodes(storyDetail.nodes || []);
        setAllEdges(storyDetail.edges || []);

        const startNode = (storyDetail.nodes || []).find(n => n.data?.type === 'STORY_START');
        
        if (startNode) {
          setCurrentNode(startNode);
        } else if ((storyDetail.nodes || []).length > 0) {
          // Fallback: if no STORY_START, try to find any node of type STORY or QUESTION as a starting point
          // Or simply use the first node if backend guarantees a valid start node always exists in a playable story
          const fallbackStartNode = (storyDetail.nodes || []).find(n => n.data?.type === 'STORY' || n.data?.type === 'QUESTION') || storyDetail.nodes[0];
          if (fallbackStartNode) {
            setCurrentNode(fallbackStartNode);
            console.warn("STORY_START node not found, using fallback:", fallbackStartNode.id);
          } else {
            setError("시작 노드를 찾을 수 없거나 스토리가 비어있습니다.");
          }
        } else {
          setError("스토리에 노드가 없습니다.");
        }
      } else {
        setError("스토리 상세 정보를 불러올 수 없습니다.");
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
    if (!currentNode || !allEdges.length) return [];
    // For QUESTION_INPUT, choices are usually handled by a submit button, not direct edges.
    // The backend proceedGame will handle routing for QUESTION_INPUT based on user_input.
    // For STORY or QUESTION nodes, edges are the choices.
    if (currentNode.data?.type === 'QUESTION_INPUT') return []; 

    return allEdges
      .filter(edge => edge.source === currentNode.id)
      // Add any condition filtering if edges have conditions based on currentStats
      // .filter(edge => !edge.data?.condition || edge.data.condition(currentStats))
      .slice(0, currentNode.data?.type === 'STORY' ? 1 : 2); // STORY node has 1 choice, QUESTION has up to 2
  }, [currentNode, allEdges /*, currentStats */]);

  const handleChoice = useCallback(async (chosenEdge) => {
    if (!currentNode || !chosenEdge) return;

    setIsLoading(true);
    setCardPosition({ x: chosenEdge.id === (currentChoices[0]?.id) ? -(window.innerWidth) : (window.innerWidth) , y: 0 }); // Animate out
    setCardRotation(chosenEdge.id === (currentChoices[0]?.id) ? -45 : 45);


    try {
      const result = await storyService.proceedGame(
        storyId,
        currentNode.id,
        chosenEdge.id,
        null, // No user_input for edge choices
        currentStats
      );

      setCurrentStats(result.updated_stats || {});
      
      if (result.is_game_over) {
        setIsGameOver(true);
        setFinalMessage(result.final_message || "게임이 종료되었습니다.");
        setCurrentNode(null); // Clear current node on game over
      } else if (result.next_node_data) {
        const nextNodeFrontend = transformNodeForFrontend(result.next_node_data);
        if (nextNodeFrontend) {
          setCurrentNode(nextNodeFrontend);
        } else {
          // transformNodeForFrontend returned null, meaning backendNode was invalid
          setError("다음 노드 데이터 처리 중 오류가 발생했습니다. (Invalid next_node_data from backend)");
          setIsGameOver(true);
          setFinalMessage("게임 데이터를 올바르게 받아오지 못했습니다.");
          setCurrentNode(null);
        }
        setInputValue(""); 
        setCharCount(0);
      } else {
        // This case should ideally not happen if backend always provides a next node or game over
        setError("다음 노드 정보를 받지 못했습니다.");
        setIsGameOver(true); // Treat as game over if no next node
        setFinalMessage("오류: 다음 진행 상태를 알 수 없습니다.");
      }
    } catch (err) {
      console.error("게임 진행 실패:", err);
      setError(err.message || "게임 진행 중 오류가 발생했습니다.");
      // Potentially set isGameOver to true here as well
    } finally {
      // Reset card position after a delay for the exit animation to complete
      setTimeout(() => {
        setCardPosition({ x: 0, y: 0 });
        setCardRotation(0);
        setIsLoading(false);
      }, 350); // Match exit animation duration
    }
  }, [storyId, currentNode, currentStats, currentChoices, navigate]);
  
  const handleInputSubmit = useCallback(async () => {
    if (!currentNode || currentNode.data?.type !== 'QUESTION_INPUT' || !inputValue.trim()) {
      setError("입력 제출에 필요한 정보가 부족하거나 유효하지 않은 입력입니다.");
      return;
    }
    setIsLoading(true);
    try {
      // For QUESTION_INPUT, there might not be a specific "chosen_edge_id".
      // The backend might determine the next node based on the input.
      // We need to clarify how edges are structured for QUESTION_INPUT if proceedGame expects an edge ID.
      // Assuming the first (and likely only) outgoing edge from a QUESTION_INPUT node is the one to use.
      const outgoingEdge = allEdges.find(edge => edge.source === currentNode.id);

      const result = await storyService.proceedGame(
        storyId,
        currentNode.id,
        outgoingEdge?.id || null, // Pass the edge ID if available, otherwise null. Backend should handle.
        inputValue,
        currentStats
      );

      setCurrentStats(result.updated_stats || {});

      if (result.is_game_over) {
        setIsGameOver(true);
        setFinalMessage(result.final_message || "게임이 종료되었습니다.");
        setCurrentNode(null);
      } else if (result.next_node_data) {
        const nextNodeFrontend = transformNodeForFrontend(result.next_node_data);
        if (nextNodeFrontend) {
          setCurrentNode(nextNodeFrontend);
        } else {
          setError("입력 결과 노드 데이터 처리 중 오류. (Invalid next_node_data from backend)");
          setIsGameOver(true);
          setFinalMessage("게임 데이터를 올바르게 받아오지 못했습니다.");
          setCurrentNode(null);
        }
        setInputValue("");
        setCharCount(0);
      } else {
        setError("다음 노드 정보를 받지 못했습니다.");
        setIsGameOver(true);
        setFinalMessage("오류: 다음 진행 상태를 알 수 없습니다.");
      }
    } catch (err) {
      console.error("입력 제출 실패:", err);
      setError(err.message || "입력 제출 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false); // Card animation reset not needed here as it's not a card swipe
    }
  }, [storyId, currentNode, inputValue, currentStats, allEdges, navigate]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    setCharCount(value.length);
  };

  const bindCardDrag = useDrag(
    ({ down, movement: [mx], direction: [dx], velocity: [vx], tap, swipe: [swipeX] }) => {
      if (tap || currentNode?.data?.type === 'QUESTION_INPUT' || isLoading || isGameOver) return;

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
        if (swipeX !== 0) { // swipeX is -1 for left, 1 for right
          // currentChoices should be [<left_choice_edge_obj>, <right_choice_edge_obj>] or one of them
          const choiceIndex = swipeX === SWIPE_DIRECTION.RIGHT ? (currentChoices.length > 1 ? 1 : 0) : 0;
          const chosenEdge = currentChoices[choiceIndex];
          
          if (chosenEdge) {
            // No need to set card position here, handleChoice will do it for animation
            // setCardPosition({ x: swipeX * (window.innerWidth), y: 0 });
            // setCardRotation(swipeX * 45);
            handleChoice(chosenEdge); 
          } else {
            // No valid choice for this swipe, reset card
            setSwipeDirectionHint(SWIPE_DIRECTION.NONE);
            setCardPosition({ x: 0, y: 0 });
            setCardRotation(0);
          }
        } else {
          // No swipe, reset card
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
      if (isLoading || !currentNode || isGameOver) return;

      if (currentNode.data?.type === 'QUESTION_INPUT') {
        if (event.key === 'Enter' && inputValue.trim()) {
          handleInputSubmit();
        }
      } else {
        let chosenEdge = null;
        if (event.key === 'ArrowLeft' && currentChoices[0]) {
          chosenEdge = currentChoices[0];
        } else if (event.key === 'ArrowRight') {
          const choiceIndex = currentChoices.length > 1 ? 1 : 0;
          if (currentChoices[choiceIndex]) {
            chosenEdge = currentChoices[choiceIndex];
          }
        }
        if (chosenEdge) {
          handleChoice(chosenEdge);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, currentNode, currentChoices, handleChoice, handleInputSubmit, inputValue, isGameOver]);

  const handleExitGame = () => {
    navigate(`/`);
  };

  if (isLoading && !currentNode && !isGameOver) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-white text-2xl">로딩 중...</div>;
  if (error && !isGameOver) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-red-500 text-xl p-4 text-center">오류: {error}</div>;
  
  if (isGameOver) {
    return (
      <div style={gameFontStyle} className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
        <h1 style={gameTitleFontStyle} className="text-3xl mb-6">{gameTitle}</h1>
        <p className="text-xl mb-8 whitespace-pre-line">{finalMessage || "게임이 종료되었습니다."}</p>
        {error && <p className="text-red-400 mb-4">오류 발생: {error}</p>}
        <button 
          onClick={handleExitGame}
          className="mt-8 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-lg shadow-lg transition-colors duration-200"
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  if (!currentNode) return <div style={gameFontStyle} className="flex items-center justify-center min-h-screen bg-black text-gray-400 text-xl">게임을 시작할 수 없습니다. (현재 노드 없음)</div>;

  // Determine hint texts based on currentChoices (which are edges)
  let leftHintText = "";
  let rightHintText = "";
  if (currentNode.data?.type !== 'QUESTION_INPUT' && swipeDirectionHint !== SWIPE_DIRECTION.NONE) {
    if (swipeDirectionHint === SWIPE_DIRECTION.LEFT && currentChoices[0]) {
      leftHintText = currentChoices[0].label || `선택 1`;
    }
    if (swipeDirectionHint === SWIPE_DIRECTION.RIGHT) {
      const rightChoice = currentChoices.length > 1 ? currentChoices[1] : (currentChoices.length === 1 ? currentChoices[0] : null) ;
      if (rightChoice) {
         rightHintText = rightChoice.label || `선택 ${currentChoices.length > 1 ? 2 : 1}`;
      }
    }
  }
  
  return (
    <div style={gameFontStyle} className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-4 sm:p-6 overflow-hidden select-none">
      <button onClick={handleExitGame} className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-white z-20" aria-label="게임 종료">✕</button>
      <div className="w-full max-w-md flex justify-around items-center p-2 sm:p-3 my-4 sm:my-6">
        {Object.entries(currentStats).map(([stat, value]) => (
          <div key={stat} className="flex flex-col items-center mx-1 sm:mx-2" title={`${stat}: ${value}`}>
            <div className="text-2xl sm:text-3xl h-8 flex items-center justify-center">{statIcons[stat] || '?'}</div>
            {/* Simple progress bar, assuming max stat value around 10-20 for visual representation */}
            <div className="h-1 w-8 sm:w-12 mt-1 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${Math.max(0, Math.min(value, 20)) * 5}%` }} ></div></div>
          </div>
        ))}
      </div>
      {currentNode.data?.characterName && (<div style={gameTitleFontStyle} className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-center">{currentNode.data.characterName}</div>)}
      <div className="relative w-full max-w-xs h-[28rem] sm:h-[32rem] flex items-center justify-center mb-4">
        {currentNode.data?.type === 'QUESTION_INPUT' ? ( 
          <motion.div 
            key={`${currentNode.id}-input`} 
            className="w-full h-full bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-5 flex flex-col justify-center items-center text-center" 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.3 }}
          > 
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{currentNode.data?.text_content}</h2>
            <textarea 
              value={inputValue} 
              onChange={handleInputChange} 
              maxLength={100} 
              className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none placeholder-gray-500" 
              placeholder={currentNode.data?.inputPrompt || "답변을 입력하세요..."}
            ></textarea>
            <div className="text-sm text-gray-400 mt-2">{charCount}/100</div>
            <button 
              onClick={handleInputSubmit} 
              disabled={!inputValue.trim() || isLoading} 
              className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xl font-bold rounded-lg shadow-lg transition-colors duration-200"
            >
              {isLoading ? '처리중...' : '확인'}
            </button> 
          </motion.div>
        ) : ( 
        <>
            <AnimatePresence> 
              {swipeDirectionHint !== SWIPE_DIRECTION.NONE && (leftHintText || rightHintText) && ( 
                <motion.div 
                  key={swipeDirectionHint === SWIPE_DIRECTION.LEFT ? "hint-left" : "hint-right"} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 20, transition: { duration: 0.1 } }} 
                  className={`absolute top-10 px-4 py-2 text-xl font-bold rounded-lg shadow-xl z-10 ${swipeDirectionHint === SWIPE_DIRECTION.LEFT ? 'left-4 bg-red-600 text-white -rotate-12 origin-bottom-left transform -translate-x-full' : 'right-4 bg-blue-600 text-white rotate-12 origin-bottom-right transform translate-x-full'}`}
                > 
                  {swipeDirectionHint === SWIPE_DIRECTION.LEFT ? leftHintText : rightHintText} 
                </motion.div> 
              )} 
            </AnimatePresence>
            <AnimatePresence mode="wait"> 
              {currentNode && currentNode.id && ( 
                <motion.div 
                  key={currentNode.id} 
                  {...bindCardDrag()} 
                  className="absolute w-[19rem] h-[28rem] sm:w-80 sm:h-[32rem] bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-5 cursor-grab flex flex-col justify-between items-center text-center" 
                  style={{ touchAction: 'none' }} 
                  initial={{ scale: 0.8, opacity: 0, y: 60 }} 
                  animate={{ x: cardPosition.x, y: cardPosition.y, rotate: cardRotation, scale: 1, opacity: 1 }} 
                  exit={{ 
                    x: cardPosition.x + (cardPosition.x === 0 ? 0 : (cardPosition.x > 0 ? (window.innerWidth || 300) : -(window.innerWidth || 300))), 
                    opacity: 0, 
                    scale: 0.7, 
                    transition: { duration: 0.35 } 
                  }} 
                  transition={{ type: "spring", stiffness: 280, damping: 25 }}
                > 
                  <div className="w-full flex-shrink-0 mb-3">
                    <img 
                      src={currentNode.data?.imageUrl || `https://placehold.co/300x180/${currentNode.id === '1' ? '2D3748' : '4A5568'}/E2E8F0?text=${encodeURIComponent(currentNode.data?.label || '장면')}&font=sans`} 
                      alt={currentNode.data?.label || "게임 장면"} 
                      className="w-full h-40 sm:h-48 object-cover rounded-lg shadow-md" 
                      onError={(e) => { e.currentTarget.src = `https://placehold.co/300x180/718096/E2E8F0?text=이미지없음&font=sans`; e.currentTarget.alt = '이미지 로드 실패';}} 
                    />
                  </div>
                  <p className="text-lg sm:text-xl leading-relaxed my-auto overflow-y-auto max-h-32 sm:max-h-40 px-2">{currentNode.data?.text_content}</p>
                  {/* Display choices as buttons if they exist and node is not for input */}
                  {currentChoices.length > 0 && currentNode.data?.type !== 'QUESTION_INPUT' && (
                  <div className="w-full mt-auto pt-3 border-t border-gray-700">
                    <div className={`grid ${currentChoices.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}> 
                      {currentChoices.map((choiceEdge, index) => ( 
                        <button 
                          key={choiceEdge.id} 
                          onClick={() => handleChoice(choiceEdge)} 
                          disabled={isLoading}
                          className={`w-full py-3 px-2 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md ${index === 0 ? (currentChoices.length === 1 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700') : 'bg-blue-600 hover:bg-blue-700'}`}
                        > 
                          {isLoading ? '...' : (choiceEdge.label || `선택 ${index + 1}`)}
                        </button> 
                      ))}
                    </div>
                  </div>
                  )}
                </motion.div> 
              )} 
            </AnimatePresence>
          </>
        )}
      </div>
      <div style={gameTitleFontStyle} className="text-sm text-gray-500 mt-auto mb-2">{gameTitle}</div>
    </div>
  );
}
export default GamePlayerPage;
