// src/components/layout/Navbar.jsx
// (이전 navbar_jsx_v9_pre_backend_final_180300과 동일)
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Navbar({ editorActions }) {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditorPage = location.pathname.startsWith('/editor/');

  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const commonButtonClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const inactiveButtonClass = "text-gray-700 hover:bg-teal-100 hover:text-teal-600";
  const editorButtonClass = "bg-sky-500 hover:bg-sky-600 text-white";
  const playButtonClass = "bg-green-500 hover:bg-green-600 text-white";

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 h-16 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={isAuthenticated ? "/" : "/auth"} className="font-bold text-xl text-teal-700 hover:text-teal-600 transition-colors">
              인터랙티브 스토리 게임
            </Link>
            {isEditorPage && editorActions?.storyTitle && (
              <span className="ml-4 text-lg font-semibold text-gray-700 hidden md:block">
                | {editorActions.storyTitle}
              </span>
            )}
          </div>
          {!isLoading && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isAuthenticated ? (
                <>
                  {isEditorPage && editorActions && (
                    <>
                      <button onClick={editorActions.onAddNode} className={`${commonButtonClass} ${editorButtonClass}`}>노드 추가</button>
                      <button onClick={editorActions.onSave} className={`${commonButtonClass} ${editorButtonClass}`}>저장하기</button>
                      <button onClick={editorActions.onPlayFromNode} className={`${commonButtonClass} ${playButtonClass}`}>플레이하기</button>
                      {/* AI 생성 버튼은 NodeEditSidebar로 이동 */}
                      <div className="h-6 border-l border-gray-300 mx-1"></div>
                    </>
                  )}
                  {!isEditorPage && (
                     <Link to="/" className={`${commonButtonClass} ${inactiveButtonClass}`}>내 스토리</Link>
                  )}
                  <span className="text-sm text-gray-700 hidden lg:block">{user?.username || user?.email || '사용자'}님</span>
                  <button onClick={handleLogoutClick} className={`${commonButtonClass} bg-red-500 text-white hover:bg-red-600`}>로그아웃</button>
                </>
              ) : (
                <Link to="/auth" className={`${commonButtonClass} bg-teal-500 text-white hover:bg-teal-600`}>로그인</Link>
              )}
            </div>
          )}
          {isLoading && (<div className="text-sm text-gray-500">확인 중...</div>)}
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
