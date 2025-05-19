// src/pages/AuthPage.jsx
// (이전 auth_page_jsx_v4_pre_backend_final_180300과 동일)
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('[AuthPage useEffect] isAuthenticated:', isAuthenticated, 'isAuthLoading:', isAuthLoading);
    if (isAuthenticated && !isAuthLoading) {
      const from = location.state?.from?.pathname || '/';
      console.log('[AuthPage useEffect] Navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (isLoginView) await login(email, password);
      else {
        await signup(email, username, password);
        setIsLoginView(true); setEmail(''); setUsername(''); setPassword('');
      }
    } catch (err) {
      setError(err.message || (isLoginView ? '로그인 실패' : '회원가입 실패'));
    } finally {
      setIsSubmitting(false);
    }
  };
  const toggleView = () => { setIsLoginView(!isLoginView); setError(''); setEmail(''); setUsername(''); setPassword(''); };
  if (isAuthLoading) return <div className="p-8 text-center text-gray-500">인증 정보 확인 중...</div>;

  return ( /* ... (JSX는 이전과 동일) ... */ 
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
        <div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{isLoginView ? '계정에 로그인하세요' : '새 계정 만들기'}</h2></div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
          <div className="rounded-md shadow-sm">
            <div><input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" placeholder="이메일 주소 (test@example.com)" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting}/></div>
            {!isLoginView && (<div className="mt-[-1px]"><input id="username" name="username" type="text" autoComplete="username" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm" placeholder="사용자 이름 (닉네임)" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSubmitting}/></div>)}
            <div className="mt-[-1px]"><input id="password" name="password" type="password" autoComplete={isLoginView ? "current-password" : "new-password"} required className={`appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 ${isLoginView && !username ? 'rounded-b-md' : ''} ${!isLoginView ? 'rounded-b-md' : ''} focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm`} placeholder="비밀번호 (password)" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting}/></div>
          </div>
          <div><button type="submit" disabled={isSubmitting} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 disabled:cursor-not-allowed">{isSubmitting ? (isLoginView ? '로그인 중...' : '가입 중...') : (isLoginView ? '로그인' : '회원가입')}</button></div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">{isLoginView ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'} <button onClick={toggleView} className="font-medium text-teal-600 hover:text-teal-500 hover:underline ml-1 disabled:text-gray-400 disabled:cursor-not-allowed" disabled={isSubmitting}>{isLoginView ? '회원가입' : '로그인'}</button></p>
      </div>
    </div>
  );
}
export default AuthPage;
