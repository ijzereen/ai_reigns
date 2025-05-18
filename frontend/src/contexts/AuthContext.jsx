// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService'; // Mock authService 사용

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      if (token) {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (e) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
          }
        } else {
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await authService.login(email, password);
      if (data.access_token && data.user) {
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);
      } else {
        throw new Error("로그인 서비스에서 유효한 데이터를 반환하지 않았습니다.");
      }
      setIsLoading(false);
      return data.user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (email, username, password) => {
    try {
      const signedUpUser = await authService.signup(email, username, password);
      alert(`${signedUpUser.username}님, 회원가입이 완료되었습니다. 로그인해주세요.`);
      return signedUpUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout(); 
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("[AuthContext] 로그아웃 처리 중 오류:", error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'authToken') {
        const newToken = event.newValue;
        setToken(newToken);
        if (!newToken) {
          setUser(null);
          localStorage.removeItem('authUser');
        }
      } else if (event.key === 'authUser' && event.newValue) {
        try {
            setUser(JSON.parse(event.newValue));
        } catch(e) {
            setUser(null);
        }
      } else if (event.key === 'authUser' && !event.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
