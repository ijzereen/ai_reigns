import React, { useState } from 'react';
// 아이콘 라이브러리 (lucide-react)
import { LogIn } from 'lucide-react';

// 분리된 공용 컴포넌트 import
// import InputField from '../components/InputField';
// import Button from '../components/Button';

// 가상 API 서비스 (실제로는 별도 파일에서 import)
// import { mockApi } from '../services/api'; 

// --- 임시 컴포넌트 정의 (실제로는 위 import 문으로 대체) ---
const InputField = ({ id, label, type = 'text', value, onChange, placeholder, error, required = false, className = '' }) => (
  <div className="mb-6"> <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1"> {label} {required && <span className="text-red-500">*</span>} </label> <input type={type} id={id} value={value} onChange={onChange} placeholder={placeholder} className={`w-full px-4 py-3 bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-white placeholder-gray-500 ${className}`} required={required} /> {error && <p className="mt-1 text-xs text-red-400">{error}</p>} </div> );
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false, iconLeft }) => { const baseStyle = "px-6 py-3 rounded-lg font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"; const variants = { primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500", secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500", }; return ( <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}> {iconLeft && <span className="mr-2">{iconLeft}</span>} {children} </button> ); };
const mockApi = { login: async (email, password) => { console.log('Mock API: login from LoginPage', { email, password }); return new Promise(resolve => setTimeout(() => { if (email === 'test@example.com' && password === 'password') { const userData = { id: 1, email: 'test@example.com', username: '테스트유저' }; const token = 'fake-jwt-token-for-' + userData.id; resolve({ success: true, data: { user: userData, token } }); } else { resolve({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }); } }, 500)); }, };
// --- 임시 컴포넌트 정의 끝 ---


const LoginPage = ({ onLogin, navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    setIsLoading(true);
    const result = await mockApi.login(email, password);
    setIsLoading(false);
    if (result.success) {
      onLogin(result.data.user, result.data.token); 
    } else {
      setError(result.error || '로그인 실패');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-gray-800 rounded-lg shadow-xl animate-fadeIn">
      <h2 className="text-3xl font-bold text-center mb-8 text-indigo-400">로그인</h2>
      <form onSubmit={handleSubmit}>
        <InputField 
          id="login-email" 
          label="이메일" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="you@example.com" 
          error={error.includes('이메일') || (error && !error.includes('비밀번호')) ? error : ''}
          required 
        />
        <InputField 
          id="login-password" 
          label="비밀번호" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="********" 
          error={error.includes('비밀번호') ? error : ''}
          required 
        />
        {error && !error.includes('이메일') && !error.includes('비밀번호') && 
          <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
        }
        <Button type="submit" className="w-full mt-2" disabled={isLoading} iconLeft={isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : <LogIn size={20} />}>
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </form>
      <p className="text-center mt-6 text-sm text-gray-400">
        계정이 없으신가요? <button onClick={() => navigateTo('signup')} className="text-indigo-400 hover:underline font-medium">회원가입</button>
      </p>
    </div>
  );
};

export default LoginPage;
