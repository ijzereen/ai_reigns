import React from 'react';
// 아이콘 라이브러리 (lucide-react)
import { LogIn, UserPlus, List, PlusCircle, Brain, Zap, Edit, Share2 } from 'lucide-react';

// HomePage 컴포넌트
const HomePage = ({ navigateTo, user }) => {
  return (
    <div className="text-center py-10 md:py-16 px-4">
      <Brain size={64} className="mx-auto text-indigo-400 mb-6 animate-pulse" />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
        인터랙티브 스토리 게임
      </h1>
      <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
        당신만의 이야기를 창조하고, LLM과 함께 무한한 가능성을 탐험하세요. 모든 선택이 새로운 운명을 만듭니다. 지금 바로 당신의 상상력을 펼쳐보세요!
      </p>
      <div className="space-y-4 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row justify-center items-center mb-16">
        {user ? (
          <>
            <button 
              onClick={() => navigateTo('stories')} 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg"
            >
              <List size={22} className="mr-2.5" /> 내 스토리 보기
            </button>
            <button 
              onClick={() => navigateTo('editor', { storyId: 'new' })} 
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-green-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg"
            >
              <PlusCircle size={22} className="mr-2.5" /> 새 스토리 만들기
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => navigateTo('login')} 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg"
            >
              <LogIn size={22} className="mr-2.5" /> 로그인
            </button>
            <button 
              onClick={() => navigateTo('signup')} 
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-gray-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg"
            >
              <UserPlus size={22} className="mr-2.5" /> 회원가입
            </button>
          </>
        )}
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:bg-gray-700/70 transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full mx-auto mb-4">
            <Edit size={32} />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-indigo-300">직관적인 에디터</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            React-flow 기반의 시각적 스토리 트리 에디터로 누구나 쉽게 복잡한 이야기를 구성하고 편집할 수 있습니다.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:bg-gray-700/70 transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full mx-auto mb-4">
            <Zap size={32} />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-purple-300">LLM 파워</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            AI의 힘을 빌려 막히는 부분 없이 스토리를 확장하고, 동적인 분기를 생성하며 창의력을 극대화하세요.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl hover:bg-gray-700/70 transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-pink-500/20 text-pink-400 rounded-full mx-auto mb-4">
            <Share2 size={32} />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-pink-300">공유와 플레이</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            만든 이야기를 친구들과 공유하고, Reigns 스타일의 인터랙티브 게임으로 즉시 플레이하며 즐거움을 나누세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage; // HomePage 컴포넌트를 export 합니다.
