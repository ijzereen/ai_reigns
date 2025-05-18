import React from 'react';
// 아이콘 라이브러리 (lucide-react)
import { Home, LogIn, UserPlus, List, PlusCircle, LogOut, UserCircle, BookOpen } from 'lucide-react';

// --- UI 디자인 상수 (실제 프로젝트에서는 테마 컨텍스트나 CSS 변수 등으로 관리 가능) ---
const POINT_COLOR = '#50AD98'; // RGB(80, 173, 152)
const TEXT_COLOR_NAV = '#374151'; // Navbar 텍스트 (gray-700)
const TEXT_COLOR_NAV_HOVER = POINT_COLOR;
const TEXT_COLOR_NAV_ACTIVE = POINT_COLOR;
const BORDER_COLOR_NAV = '#E5E7EB'; // Navbar 하단 테두리 (gray-300)
const CARD_BACKGROUND_COLOR = '#FFFFFF'; // Navbar 배경

const Navbar = ({ currentPage, navigateTo, user, onLogout }) => {
  const navItems = [
    { name: '홈', page: 'home', icon: <Home size={17} /> },
  ];

  const authNavItems = [
    { name: '내 스토리', page: 'stories', icon: <List size={17} /> },
    { 
      name: '새 스토리', 
      page: 'editor', 
      params: { storyId: 'new' }, 
      icon: <PlusCircle size={17} />, 
      className: `bg-[${POINT_COLOR}] text-white hover:bg-[#408E7B]` // POINT_COLOR_HOVER
    },
  ];

  const guestNavItems = [
    { name: '로그인', page: 'login', icon: <LogIn size={17} /> },
    { name: '회원가입', page: 'signup', icon: <UserPlus size={17} /> },
  ];

  const NavButton = ({ page, params, name, icon, className = '', isActive }) => (
    <button
      onClick={() => navigateTo(page, params)}
      className={`px-3 py-2 rounded-md transition-colors flex items-center text-sm font-medium
                  ${isActive ? `text-[${TEXT_COLOR_NAV_ACTIVE}]` : `text-[${TEXT_COLOR_NAV}] hover:text-[${TEXT_COLOR_NAV_HOVER}] hover:bg-gray-100`}
                  ${className}`}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {name}
    </button>
  );

  return (
    <nav className="fixed w-full top-0 left-0 z-50 shadow-sm border-b" style={{ backgroundColor: CARD_BACKGROUND_COLOR, borderColor: BORDER_COLOR_NAV }}>
      <div className="container mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigateTo('home')}
          className="text-lg font-semibold flex items-center transition-colors"
          style={{ color: POINT_COLOR }}
        >
          <BookOpen size={22} className="mr-2" />
          스토리텔러
        </button>
        <div className="space-x-1 md:space-x-2 flex items-center">
          {navItems.map(item => (
            <NavButton 
              key={item.page} 
              page={item.page} 
              params={item.params} 
              name={item.name} 
              icon={item.icon} 
              className={item.className}
              isActive={currentPage === item.page}
            />
          ))}
          {user ? (
            <>
              {authNavItems.map(item => (
                 <NavButton 
                  key={item.page} 
                  page={item.page} 
                  params={item.params} 
                  name={item.name} 
                  icon={item.icon} 
                  className={item.className}
                  isActive={currentPage === item.page}
                />
              ))}
              <div className="flex items-center text-sm text-gray-700 pl-2">
                <UserCircle size={20} className="mr-1 text-gray-400" />
                <span className="hidden sm:inline">{user.username || user.email}</span>
              </div>
              <button 
                onClick={onLogout} 
                className={`px-3 py-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex items-center text-sm font-medium`}
              >
                <LogOut size={17} className="mr-1" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </>
          ) : (
            guestNavItems.map(item => (
              <NavButton 
                key={item.page} 
                page={item.page} 
                params={item.params} 
                name={item.name} 
                icon={item.icon} 
                className={item.className}
                isActive={currentPage === item.page}
              />
            ))
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
