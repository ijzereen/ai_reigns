import React, { useState } from 'react';
import './LoginPage.css';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 로그인 로직 구현
    console.log('Login attempt:', { username, password });
    
    // 간단한 로그인 검증 (실제로는 서버 검증 필요)
    if (username && password) {
      onLoginSuccess?.();
    }
  };

  return (
    <div className="login-page">
      <div className="background-rectangle"></div>
      
      <div className="login-title">
        <h1>It's my story</h1>
      </div>

      <div className="login-container">
        <div className="name-section">
          <h2>Roy</h2>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {!username && <div className="placeholder-text username">e.g., RoyWalker</div>}
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {!password && <div className="placeholder-text password">A Secret Word</div>}
          </div>

          <button type="submit" className="login-button">
            로그인
          </button>
        </form>

        <div className="forgot-password">
          <a href="/forgot-password">비밀번호를 잊으셨나요?</a>
        </div>

        <div className="signup-link">
          <a href="/signup">계정이 없으시다면? 가입하기</a>
        </div>
      </div>

      <footer className="footer">
        <p>2025 SeedCoop All Right Reversed</p>
      </footer>
    </div>
  );
};

export default LoginPage; 