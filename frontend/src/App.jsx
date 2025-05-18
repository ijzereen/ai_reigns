// src/App.jsx
import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthPage from './pages/AuthPage';
import StoryListPage from './pages/StoryListPage';
import StoryEditorPageWithProvider from './pages/StoryEditorPage';
import GamePlayerPage from './pages/GamePlayerPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="flex justify-center items-center h-screen text-gray-500">인증 정보 확인 중...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="flex justify-center items-center h-screen text-gray-500">인증 정보 확인 중...</div>;
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditorPage = location.pathname.startsWith('/editor/');
  const isGamePage = location.pathname.startsWith('/play/');
  const currentStoryId = isEditorPage ? location.pathname.split('/editor/')[1] : (isGamePage ? location.pathname.split('/play/')[1].split('?')[0] : null);

  const [currentStoryTitle, setCurrentStoryTitle] = useState('');
  const editorRef = useRef(null);

  const handleAddNode = useCallback(() => {
    if (editorRef.current?.triggerAddNode) editorRef.current.triggerAddNode();
  }, []);
  const handleSaveStory = useCallback(() => {
    if (editorRef.current?.triggerSave) editorRef.current.triggerSave();
  }, []);
  const handlePlayFromNode = useCallback(() => {
    if (!currentStoryId) return;
    let startNodeId = editorRef.current?.getSelectedNodeId ? editorRef.current.getSelectedNodeId() : '';
    navigate(`/play/${currentStoryId}?startNode=${startNodeId || ''}`, { state: { fromEditor: true } });
  }, [navigate, currentStoryId, editorRef]);
  
  const handleAiGenerate = useCallback((aiParams) => {
    if (editorRef.current?.triggerAiGenerate) {
      editorRef.current.triggerAiGenerate(aiParams);
    } else {
      console.warn("Editor ref is not set or triggerAiGenerate is not available for AI generation.");
      alert("AI 생성 기능을 사용할 수 없습니다. (ref 오류)");
    }
  }, [editorRef]);

  const editorActions = isEditorPage ? {
    storyTitle: currentStoryTitle || "스토리 편집",
    onAddNode: handleAddNode,
    onSave: handleSaveStory,
    onPlayFromNode: handlePlayFromNode,
    onAiGenerate: handleAiGenerate,
  } : null;

  if (isGamePage) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <Routes>
          <Route path="/play/:storyId" element={<ProtectedRoute><GamePlayerPage /></ProtectedRoute>} />
          <Route path="/play" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={`/play/${currentStoryId || ''}`} replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isEditorPage ? 'h-screen' : 'min-h-screen'} bg-gray-100 font-sans`}>
      <Navbar editorActions={editorActions} />
      <main className={`flex-grow ${isEditorPage ? 'w-full overflow-hidden' : 'container mx-auto px-0 sm:px-4 py-0 sm:py-6'}`}>
        {isEditorPage ? (
          <div className="h-full w-full"> 
            <Routes>
              <Route path="/editor/:storyId" element={<ProtectedRoute><StoryEditorPageWithProvider ref={editorRef} setCurrentStoryTitle={setCurrentStoryTitle} /></ProtectedRoute>} />
              <Route path="/editor" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to={`/editor/${currentStoryId || ''}`} replace />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><StoryListPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        )}
      </main>
      {!isEditorPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
