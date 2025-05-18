import React, { useState, useEffect } from 'react';
// 아이콘 라이브러리 (lucide-react)
import { List, PlusCircle, Edit3, PlayCircle, Search, Filter, Loader2 } from 'lucide-react';

// --- UI 디자인 상수 (실제 프로젝트에서는 테마 컨텍스트나 CSS 변수 등으로 관리) ---
const POINT_COLOR = '#50AD98';
const TEXT_COLOR = '#111827';
const TEXT_COLOR_SECONDARY = '#4B5563';
const BORDER_COLOR = '#E5E7EB';
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const INPUT_BACKGROUND_COLOR = '#FFFFFF';
// const BACKGROUND_COLOR = '#F9FAFB'; // App.js에서 이미 적용

// --- 공용 UI 컴포넌트 (실제로는 src/components/ 에서 import) ---
// 이 컴포넌트들은 이미 별도 파일로 분리되었다고 가정하고, StoryListPage에서는 사용만 합니다.
// 실제 프로젝트에서는 아래와 같이 import 합니다.
// import Button from '../components/Button';
// import InputField from '../components/InputField';

// 임시 Button (실제로는 src/components/Button.js에서 import)
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false, iconLeft, size = 'normal' }) => { const baseStyle = `font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-sm rounded-md`; const sizeStyles = { small: 'px-3 py-1.5 text-xs', normal: 'px-5 py-2.5 text-sm', large: 'px-7 py-3 text-base' }; const variants = { primary: `bg-[${POINT_COLOR}] hover:bg-[#408E7B] text-white focus:ring-[${POINT_COLOR}] border border-transparent`, secondary: `bg-gray-100 hover:bg-gray-200 text-[${TEXT_COLOR}] focus:ring-[${POINT_COLOR}] border border-[${BORDER_COLOR}]`, ghost: `bg-transparent hover:bg-gray-100 text-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`, }; return ( <button type={type} onClick={onClick} className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} disabled={disabled}> {iconLeft && <span className={children ? "mr-1.5" : ""}>{iconLeft}</span>} {children} </button> ); };
// 임시 InputField (실제로는 src/components/InputField.js에서 import)
const InputField = ({ id, label, type = 'text', value, onChange, placeholder, error, required = false, className = '', iconLeft }) => ( <div className="relative w-full"> {label && ( <label htmlFor={id} className={`block text-xs font-medium mb-1 ${error ? 'text-red-600' : `text-[${TEXT_COLOR_SECONDARY}]`}`} > {label} {required && <span className="text-red-500">*</span>} </label> )} {iconLeft && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> {React.cloneElement(iconLeft, { size: 16, className: `text-[${TEXT_COLOR_SECONDARY}]`})} </div>} <input type={type} id={id} value={value} onChange={onChange} placeholder={placeholder} className={`w-full ${iconLeft ? 'pl-10' : 'px-3'} py-2 bg-[${INPUT_BACKGROUND_COLOR}] border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : `border-[${BORDER_COLOR}] focus:border-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`} rounded-md outline-none transition-colors text-[${TEXT_COLOR}] placeholder-gray-400 text-sm shadow-sm ${className}`} required={required} /> {error && <p className="mt-1 text-xs text-red-500">{error}</p>} </div> );
// --- 공용 UI 컴포넌트 끝 ---

// --- 가상 API 서비스 (실제로는 src/services/api.js 에서 import) ---
const mockApi = {
  getStories: async (token) => {
    console.log('Mock API: getStories from StoryListPage with token', token);
    if (!token) return { success: false, error: '인증 토큰이 필요합니다.' };
    return new Promise(resolve => setTimeout(() => {
      resolve({
        success: true,
        data: [
          { id: 's1', title: '마법의 숲 모험', description: '신비로운 숲에서의 이야기입니다. 용감한 기사가 되어 드래곤을 물리치세요!', lastModified: '2025-05-18', author: '테스트유저', nodeCount: 15 },
          { id: 's2', title: '우주 해적의 전설', description: '은하계를 누비는 해적 선장의 스릴 넘치는 모험! 과연 그는 전설의 보물을 찾을 수 있을 것인가?', lastModified: '2025-05-17', author: '테스트유저', nodeCount: 25 },
          { id: 's3', title: '시간 여행자의 일기', description: '과거와 미래를 넘나드는 시간 여행자의 기록들. 그는 역사를 바꿀 수 있을까?', lastModified: '2025-05-16', author: '테스트유저', nodeCount: 30 },
          { id: 's4', title: '미스터리 맨션의 비밀', description: '오래된 저택에 숨겨진 비밀을 파헤치는 탐정 이야기.', lastModified: '2025-05-15', author: '다른유저', nodeCount: 12 },
        ]
      });
    }, 800)); // 로딩 시뮬레이션
  },
  // createStory API는 App.js에서 호출하고 결과를 StoryListPage로 전달하거나,
  // StoryListPage에서 직접 호출할 수도 있습니다. 여기서는 App.js에서 처리한다고 가정합니다.
};
// --- 가상 API 서비스 끝 ---

const StoryListPage = ({ navigateTo, user, stories: initialStories, isLoading: initialIsLoading, onCreateNewStory }) => {
  const [stories, setStories] = useState(initialStories || []);
  const [isLoading, setIsLoading] = useState(initialIsLoading === undefined ? true : initialIsLoading);
  const [searchTerm, setSearchTerm] = useState('');

  // App.js에서 user 객체가 변경될 때마다 스토리 목록을 다시 불러옵니다.
  useEffect(() => {
    const fetchUserStories = async () => {
      if (user && user.token) {
        setIsLoading(true);
        const result = await mockApi.getStories(user.token); // 실제 API 호출로 변경 예정
        if (result.success) {
          setStories(result.data);
        } else {
          console.error("스토리 목록 로드 실패:", result.error);
          setStories([]); // 오류 발생 시 빈 목록으로 설정
        }
        setIsLoading(false);
      } else {
        setStories([]); // 사용자가 없으면 빈 목록
        setIsLoading(false);
      }
    };
    fetchUserStories();
  }, [user]); // user 객체가 바뀔 때마다 실행

  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: TEXT_COLOR }}>내 스토리</h1>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <InputField 
            id="search-stories"
            type="search"
            placeholder="스토리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 text-xs !mb-0" // InputField의 기본 mb-4를 제거하기 위해 !mb-0 사용
            iconLeft={<Search />}
          />
          <Button 
            onClick={() => navigateTo('editor', { storyId: 'new' })} // App.js의 onCreateNewStory 대신 navigateTo 사용
            iconLeft={<PlusCircle size={16}/>}
            size="normal"
            className="h-10 whitespace-nowrap"
          >
            새 스토리
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={48} className="animate-spin" style={{color: POINT_COLOR}} />
          <p className="ml-3 text-lg" style={{color: TEXT_COLOR_SECONDARY}}>스토리 목록을 불러오는 중...</p>
        </div>
      )}

      {!isLoading && filteredStories.length === 0 && (
        <div className="text-center py-16 bg-[${CARD_BACKGROUND_COLOR}] rounded-xl shadow-md border" style={{borderColor: BORDER_COLOR}}>
          <List size={48} className="mx-auto mb-4" style={{color: TEXT_COLOR_SECONDARY}}/>
          <p className="text-lg mb-2" style={{color: TEXT_COLOR_SECONDARY}}>
            {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : "아직 생성된 스토리가 없습니다."}
          </p>
          {!searchTerm && 
            <p className="text-sm mb-6" style={{color: TEXT_COLOR_SECONDARY}}>첫 번째 스토리를 만들어 모험을 시작해보세요!</p>
          }
          <Button onClick={() => navigateTo('editor', { storyId: 'new' })} iconLeft={<PlusCircle size={16}/>}>
            새 스토리 만들기
          </Button>
        </div>
      )}

      {!isLoading && filteredStories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map(story => (
            <div 
              key={story.id} 
              className="bg-[${CARD_BACKGROUND_COLOR}] p-5 rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 flex flex-col justify-between" 
              style={{borderColor: BORDER_COLOR}}
            >
              <div>
                <h3 className="text-md font-semibold mb-1.5 truncate" style={{color: POINT_COLOR}}>{story.title}</h3>
                <p className="text-xs mb-2 h-16 overflow-hidden text-ellipsis leading-relaxed" style={{color: TEXT_COLOR_SECONDARY}}>{story.description || '설명이 없습니다.'}</p>
              </div>
              <div className="mt-3 pt-3 border-t" style={{borderColor: BORDER_COLOR}}>
                <p className="text-xs mb-3" style={{color: TEXT_COLOR_SECONDARY}}>
                  노드 수: {story.nodeCount || 0}개 <span className="mx-1">|</span> 최종 수정: {story.lastModified}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => navigateTo('editor', { storyId: story.id })} 
                    variant="secondary" 
                    size="small" 
                    className="flex-1" 
                    iconLeft={<Edit3 size={14}/>}
                  > 
                    편집
                  </Button>
                  <Button 
                    onClick={() => navigateTo('player', { storyId: story.id })} 
                    variant="ghost" 
                    size="small" 
                    className="flex-1" 
                    iconLeft={<PlayCircle size={14}/>}
                  > 
                    플레이 
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryListPage;
