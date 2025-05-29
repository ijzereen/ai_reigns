import React, { useState } from 'react';
import LoginPage from './pages/login/LoginPage';
import SettingsPage from './pages/settings/SettingsPage';
import EditorPage from './pages/editor/EditorPage';
import './App.css';

type PageType = 'login' | 'settings' | 'editor';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('login');

  const handleLoginSuccess = () => {
    setCurrentPage('settings');
  };

  const handleBackToLogin = () => {
    setCurrentPage('login');
  };

  const handleSettingsToEditor = () => {
    setCurrentPage('editor');
  };

  const handleBackToSettings = () => {
    setCurrentPage('settings');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'settings':
        return <SettingsPage onBack={handleBackToLogin} onNext={handleSettingsToEditor} />;
      case 'editor':
        return <EditorPage onBack={handleBackToSettings} />;
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App;
