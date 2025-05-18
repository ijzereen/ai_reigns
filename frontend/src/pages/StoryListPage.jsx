// src/pages/StoryListPage.jsx
// (이전 story_list_page_jsx_v3_pre_backend_final_180300과 동일)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storyService } from '../services/storyService'; // Mock service
// import { useAuth } from '../contexts/AuthContext'; // 토큰은 storyService 내부에서 처리 (필요시)

function StoryListPage() {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // const { token } = useAuth(); // 실제 API 호출 시 사용

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Mock storyService는 현재 token 인자를 사용하지 않음
        const fetchedStories = await storyService.getMyStories(/* token */); 
        setStories(fetchedStories);
      } catch (err) {
        setError(err.message || '스토리 목록 로드 실패');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, [/* token */]); // token이 변경될 때마다 목록을 다시 불러올 수 있음

  const handleCreateNewStory = async () => {
    const newTitle = prompt("새 스토리의 제목을 입력하세요:");
    if (newTitle && newTitle.trim() !== "") {
      const newStoryData = {
        title: newTitle.trim(),
        description: prompt("스토리 설명을 입력하세요 (선택 사항):") || "",
      };
      try {
        // Mock storyService는 현재 token 인자를 사용하지 않음
        const createdStory = await storyService.createStory(newStoryData /*, token */);
        setStories(prevStories => [createdStory, ...prevStories]);
        alert(`'${createdStory.title}' 스토리가 생성되었습니다! (Mock)`);
      } catch (err) {
        alert(`스토리 생성 실패: ${err.message}`);
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">스토리 목록 로딩 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-100 rounded-md">오류: {error}</div>;

  return ( /* ... (JSX는 이전과 동일) ... */ 
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">내 스토리 목록</h1>
        <button onClick={handleCreateNewStory} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          <span>새 스토리 만들기</span>
        </button>
      </div>
      {stories.length === 0 ? (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">아직 스토리가 없어요!</h3>
            <p className="mt-2 text-sm text-gray-500">첫 번째 인터랙티브 스토리를 만들어 대모험을 시작해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl transform hover:-translate-y-1 flex flex-col">
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-semibold text-teal-700 mb-2 truncate" title={story.title}>{story.title}</h2>
                <p className="text-gray-600 text-sm mb-3 h-16 overflow-hidden line-clamp-4 leading-relaxed">{story.description || "설명 없음"}</p>
                <div className="text-xs text-gray-500 mb-4 space-y-1"><p><strong className="font-medium text-gray-700">초기 스탯:</strong> {story.initial_stats ? JSON.stringify(story.initial_stats) : "없음"}</p></div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex space-x-2">
                <Link to={`/editor/${story.id}`} className="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors">편집하기</Link>
                <Link to={`/play/${story.id}`} className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors">플레이하기</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default StoryListPage;
