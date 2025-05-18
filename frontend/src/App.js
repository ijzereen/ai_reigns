import React, { useState, useEffect } from 'react'; // useEffect 추가
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthPage from './pages/AuthPage';
import StoryListPage from './pages/StoryListPage';
import StoryEditorPage from './pages/StoryEditorPage';
import GamePlayerPage from './pages/GamePlayerPage';
import NotFoundPage from './pages/NotFoundPage';

// App 함수 정의는 파일 내에서 한 번만 있어야 합니다.
function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

  const handleLogin = (token) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    // 로그인 후 홈으로 이동하도록 Navigate 컴포넌트가 처리하므로 여기서는 명시적 이동 불필요
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    // Navbar에서 navigate('/auth')로 이동시키므로 여기서는 명시적 이동 불필요
  };

  // 다른 탭에서 로그아웃/로그인 시 상태 동기화를 위한 로직 (선택 사항)
  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === 'authToken' && !event.newValue) {
        setAuthToken(null);
      } else if (event.key === 'authToken' && event.newValue) {
        setAuthToken(event.newValue);
      }
    };
    window.addEventListener('storage', syncLogout);
    return () => {
      window.removeEventListener('storage', syncLogout);
    };
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
        <Navbar authToken={authToken} onLogout={handleLogout} />
        <main className="flex-grow container mx-auto px-0 sm:px-4 py-0 sm:py-6">
          <Routes>
            <Route 
              path="/auth" 
              element={authToken ? <Navigate to="/" replace /> : <AuthPage onLoginSuccess={handleLogin} />} 
            />
            <Route 
              path="/" 
              element={authToken ? <StoryListPage /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/editor/:storyId" 
              element={authToken ? <StoryEditorPage /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/editor" 
              element={authToken ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/play/:storyId" 
              element={authToken ? <GamePlayerPage /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/play" 
              element={authToken ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />} 
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;