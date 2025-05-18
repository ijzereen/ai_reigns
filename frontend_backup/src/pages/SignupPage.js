import React, { useState } from 'react';
// 아이콘 라이브러리 (lucide-react)
import { UserPlus } from 'lucide-react';

// 분리된 공용 컴포넌트 import (실제 프로젝트 경로에 맞게 수정)
// import InputField from '../components/InputField';
// import Button from '../components/Button';

// 가상 API 서비스 (실제로는 별도 파일에서 import)
// import { mockApi } from '../services/api'; 

// --- 임시 컴포넌트 정의 (실제로는 위 import 문으로 대체) ---
const InputField = ({ id, label, type = 'text', value, onChange, placeholder, error, required = false, className = '' }) => (
  <div className="mb-6"> <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1"> {label} {required && <span className="text-red-500">*</span>} </label> <input type={type} id={id} value={value} onChange={onChange} placeholder={placeholder} className={`w-full px-4 py-3 bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-white placeholder-gray-500 ${className}`} required={required} /> {error && <p className="mt-1 text-xs text-red-400">{error}</p>} </div> );
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false, iconLeft }) => { const baseStyle = "px-6 py-3 rounded-lg font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"; const variants = { primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500", secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500", }; return ( <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}> {iconLeft && <span className="mr-2">{iconLeft}</span>} {children} </button> ); };
const mockApi = { signup: async (email, username, password) => { console.log('Mock API: signup from SignupPage', { email, username, password }); return new Promise(resolve => setTimeout(() => { resolve({ success: true, data: { user: { id: Date.now(), email, username } } }); }, 500)); }, };
// --- 임시 컴포넌트 정의 끝 ---


const SignupPage = ({ onSignupSuccess, navigateTo }) => { // onSignupSuccess prop 추가
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !username || !password || !confirmPassword) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsLoading(true);
    const result = await mockApi.signup(email, username, password); // 실제 API 호출로 변경 예정
    setIsLoading(false);
    if (result.success) {
      // 회원가입 성공 시 App 컴포넌트에 알리거나, 직접 로그인 페이지로 이동
      if(onSignupSuccess) onSignupSuccess(); // App.js에서 처리할 수 있도록 콜백 호출
      alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
      navigateTo('login');
    } else {
      setError(result.error || '회원가입에 실패했습니다. 다시 시도해주세요.');
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-gray-800 rounded-lg shadow-xl animate-fadeIn">
      <h2 className="text-3xl font-bold text-center mb-8 text-indigo-400">회원가입</h2>
      <form onSubmit={handleSubmit}>
        <InputField 
          id="signup-email" 
          label="이메일" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="you@example.com" 
          error={error.includes('이메일') ? error : ''}
          required 
        />
        <InputField 
          id="signup-username" 
          label="사용자 이름" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="홍길동" 
          error={error.includes('사용자 이름') ? error : ''}
          required 
        />
        <InputField 
          id="signup-password" 
          label="비밀번호 (8자 이상)" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="********" 
          error={error.includes('비밀번호는 최소') || error.includes('비밀번호가 일치하지') ? error : ''}
          required 
        />
        <InputField 
          id="signup-confirmPassword" 
          label="비밀번호 확인" 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          placeholder="********" 
          error={error.includes('비밀번호가 일치하지') ? error : ''}
          required 
        />
        {error && !error.includes('이메일') && !error.includes('사용자 이름') && !error.includes('비밀번호') &&
          <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
        }
        <Button type="submit" className="w-full mt-2" disabled={isLoading} iconLeft={isLoading ? (
           <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : <UserPlus size={20} />}>
          {isLoading ? '가입 중...' : '회원가입'}
        </Button>
      </form>
      <p className="text-center mt-6 text-sm text-gray-400">
        이미 계정이 있으신가요? <button onClick={() => navigateTo('login')} className="text-indigo-400 hover:underline font-medium">로그인</button>
      </p>
    </div>
  );
};

export default SignupPage; // SignupPage 컴포넌트를 export 합니다.
