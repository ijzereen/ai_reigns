import React, { useState, useEffect, useCallback } from 'react';

// --- 아이콘 라이브러리 (lucide-react) ---
// 각 컴포넌트에서 필요한 아이콘을 직접 import 하는 것이 좋습니다.
// 이 파일에서는 App 컴포넌트 자체에서 직접 사용하는 아이콘은 없습니다.

// --- 실제 프로젝트에서는 아래 컴포넌트들을 각자의 파일에서 import 합니다 ---
// import Navbar from './components/Navbar';
// import Button from './components/Button'; // Button, InputField는 각 페이지에서 필요시 import
// import InputField from './components/InputField';
// import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import StoryListPage from './pages/StoryListPage';
// import StoryEditorPage from './pages/StoryEditorPage'; // StoryEditorPage import
// import GamePlayerPage from './pages/GamePlayerPage';
// import NotFoundPage from './pages/NotFoundPage';
// import { mockApi } from './services/api'; // API 서비스 분리 시
// import { POINT_COLOR, ... } from './theme'; // 테마 상수 분리 시

// --- UI 디자인 상수 (임시로 App.js에 정의, 실제로는 theme.js 등으로 분리 권장) ---
const POINT_COLOR = '#50AD98'; const POINT_COLOR_HOVER = '#408E7B'; const BACKGROUND_COLOR = '#F9FAFB'; const CARD_BACKGROUND_COLOR = '#FFFFFF'; const TEXT_COLOR = '#111827'; const TEXT_COLOR_SECONDARY = '#4B5563'; const BORDER_COLOR = '#E5E7EB'; const INPUT_BACKGROUND_COLOR = '#FFFFFF'; const BACKGROUND_COLOR_EDITOR = '#F9FAFB'; const NODE_BACKGROUND_COLOR = '#FFFFFF'; const NODE_BORDER_COLOR = BORDER_COLOR; const NODE_SELECTED_BORDER_COLOR = POINT_COLOR;

// --- 가상 API 서비스 (mockApi - 임시로 App.js에 정의, 실제로는 src/services/api.js로 분리 권장) ---
const mockApi = {
  login: async (email, password) => { console.log('Mock API: login', { email, password }); return new Promise(resolve => setTimeout(() => { if (email === 'test@example.com' && password === 'password') { const userData = { id: 1, email: 'test@example.com', username: '테스트유저' }; const token = 'fake-jwt-token-for-' + userData.id; localStorage.setItem('userToken', token); localStorage.setItem('userData', JSON.stringify(userData)); resolve({ success: true, data: { user: userData, token } }); } else { resolve({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }); } }, 500)); },
  signup: async (email, username, password) => { console.log('Mock API: signup', { email, username, password }); return new Promise(resolve => setTimeout(() => { resolve({ success: true, data: { user: { id: Date.now(), email, username } } }); }, 500)); },
  logout: async () => { console.log('Mock API: logout'); localStorage.removeItem('userToken'); localStorage.removeItem('userData'); return new Promise(resolve => setTimeout(() => resolve({ success: true }), 200)); },
  getStories: async (token) => { console.log('Mock API: getStories with token', token); if (!token) return { success: false, error: '인증 토큰이 필요합니다.' }; return new Promise(resolve => setTimeout(() => { resolve({ success: true, data: [ { id: 's1', title: '마법의 숲 모험', description: '신비로운 숲에서의 이야기입니다. 용감한 기사가 되어 드래곤을 물리치세요!', lastModified: '2025-05-18', author: '테스트유저', nodeCount: 15 }, { id: 's2', title: '우주 해적의 전설', description: '은하계를 누비는 해적 선장의 스릴 넘치는 모험! 과연 그는 전설의 보물을 찾을 수 있을 것인가?', lastModified: '2025-05-17', author: '테스트유저', nodeCount: 25 }, ] }); }, 800)); },
  createStory: async (token, storyData) => { console.log('Mock API: createStory', token, storyData); if (!token) return { success: false, error: '인증 토큰이 필요합니다.' }; return new Promise(resolve => setTimeout(() => { const newStory = {  id: `s${Date.now()}`,  ...storyData,  lastModified: new Date().toISOString().split('T')[0]  }; resolve({ success: true, data: newStory }); }, 500)); },
};

// --- 각 페이지 및 공용 컴포넌트들의 임시 정의 (실제로는 개별 파일에서 import 합니다) ---
// Navbar (src/components/Navbar.js)
const Navbar = ({ currentPage, navigateTo, user, onLogout }) => { /* ... react_navbar_component_v2_themed의 Navbar 코드 ... */ return ( <nav className="bg-white text-gray-700 p-4 fixed w-full top-0 left-0 z-50 shadow-sm border-b" style={{ borderColor: BORDER_COLOR }}> <div className="container mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8"> <button onClick={() => navigateTo('home')} className="text-lg font-semibold flex items-center transition-colors" style={{ color: POINT_COLOR }} > {/* <BookOpen size={22} className="mr-2" /> */} 스토리텔러 </button> {/* ... 나머지 Navbar 아이템들 ... */} </div> </nav> );};
// HomePage (src/pages/HomePage.js)
const HomePage = ({ navigateTo, user }) => { /* ... react_homepage_component_v1 코드 (테마 적용됨) ... */ return <div>HomePage Placeholder</div>;};
// LoginPage (src/pages/LoginPage.js)
const LoginPage = ({ onLogin, navigateTo }) => { /* ... react_loginpage_component_v1 코드 (테마 적용됨) ... */ return <div>LoginPage Placeholder</div>;};
// SignupPage (src/pages/SignupPage.js)
const SignupPage = ({ navigateTo, onSignupSuccess }) => { /* ... react_signuppage_component_v1 코드 (테마 적용됨) ... */ return <div>SignupPage Placeholder</div>;};
// StoryListPage (src/pages/StoryListPage.js)
const StoryListPage = ({ navigateTo, user }) => { /* ... react_storylistpage_component_v2_themed 코드 ... */ return <div>StoryListPage Placeholder (User: {user?.email})</div>;};
// StoryEditorPage (src/pages/StoryEditorPage.js)
const StoryEditorPage = ({ storyId, navigateTo }) => { /* ... react_storyeditorpage_v3_separated 코드 ... */ return <div>StoryEditorPage Placeholder (Story ID: {storyId})</div>;};
// GamePlayerPage (src/pages/GamePlayerPage.js - 아직 생성 안 함)
const GamePlayerPage = ({ storyId, navigateTo }) => (<div>GamePlayerPage Placeholder (Story ID: {storyId})</div>);
// NotFoundPage (src/pages/NotFoundPage.js - 아직 생성 안 함)
const NotFoundPage = ({ navigateTo }) => (<div>404 NotFoundPage Placeholder</div>);


// --- 메인 앱 컴포넌트 ---
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentPageParams, setCurrentPageParams] = useState({});
  const [user, setUser] = useState(null);

  const navigateTo = (page, params = {}) => { setCurrentPage(page); setCurrentPageParams(params); window.scrollTo(0, 0); };
  const handleLoginSuccess = (userData, token) => { setUser({ ...userData, token }); navigateTo('stories'); };
  const handleLogout = async () => { await mockApi.logout(); setUser(null); navigateTo('home'); };
  
  useEffect(() => {
    const storedToken = localStorage.getItem('userToken');
    const storedUserDataString = localStorage.getItem('userData');
    if (storedToken && storedUserDataString) {
      try {
        const storedUserData = JSON.parse(storedUserDataString);
        setUser({ ...storedUserData, token: storedToken });
      } catch (e) { console.error("저장된 사용자 정보 파싱 오류:", e); localStorage.removeItem('userToken'); localStorage.removeItem('userData'); }
    }
  }, []);

  let pageComponent;
  switch (currentPage) {
    case 'login':
      pageComponent = <LoginPage onLogin={handleLoginSuccess} navigateTo={navigateTo} />; 
      break;
    case 'signup':
      pageComponent = <SignupPage navigateTo={navigateTo} /* onSignupSuccess={handleSignupSuccess} */ />; 
      break;
    case 'stories':
      pageComponent = user ? <StoryListPage navigateTo={navigateTo} user={user} /> : <LoginPage onLogin={handleLoginSuccess} navigateTo={navigateTo} />;
      break;
    case 'editor':
      // 여기서 StoryEditorPage를 렌더링합니다.
      pageComponent = user ? <StoryEditorPage storyId={currentPageParams.storyId} navigateTo={navigateTo} /> : <LoginPage onLogin={handleLoginSuccess} navigateTo={navigateTo} />;
      break;
    case 'player':
      pageComponent = user ? <GamePlayerPage storyId={currentPageParams.storyId} navigateTo={navigateTo} /> : <LoginPage onLogin={handleLoginSuccess} navigateTo={navigateTo} />;
      break;
    case 'home':
    default:
      pageComponent = <HomePage navigateTo={navigateTo} user={user} />; 
      break;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: BACKGROUND_COLOR, color: TEXT_COLOR, fontFamily: "'Inter', sans-serif"}}>
      <Navbar currentPage={currentPage} navigateTo={navigateTo} user={user} onLogout={handleLogout} /> 
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 flex-grow">
        {pageComponent}
      </main>
      <footer className="text-center p-3 text-xs mt-auto border-t" style={{color: TEXT_COLOR_SECONDARY, borderColor: BORDER_COLOR, backgroundColor: CARD_BACKGROUND_COLOR}}>
        © 2025 인터랙티브 스토리 게임.
      </footer>
    </div>
  );
}

export default App;
