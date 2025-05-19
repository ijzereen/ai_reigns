// src/services/authService.js
const API_BASE_URL = 'http://localhost:8000/api'; // 백엔드 API 주소

export const authService = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // FastAPI OAuth2PasswordRequestForm expects form data
      },
      // body: JSON.stringify({ email, password }) // This is for application/json
      body: new URLSearchParams({ username: email, password: password }) // FastAPI uses username for email in form
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "로그인 중 오류가 발생했습니다." }));
      throw new Error(errorData.detail || "로그인 실패");
    }
    return response.json(); // { access_token, user, token_type }
  },

  signup: async (email, username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "회원가입 중 오류가 발생했습니다." }));
      throw new Error(errorData.detail || "회원가입 실패");
    }
    return response.json(); // { id, email, username }
  },

  logout: async () => {
    // 백엔드에 /api/auth/logout 엔드포인트가 있고 토큰 무효화 로직이 있다면 호출
    // const token = localStorage.getItem('token'); // 또는 AuthContext 등에서 가져오기
    // if (token) {
    //   try {
    //     await fetch(`${API_BASE_URL}/auth/logout`, {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //       },
    //     });
    //   } catch (error) {
    //     console.warn("Logout API call failed:", error);
    //     // 실패해도 로컬에서는 로그아웃 처리 계속 진행
    //   }
    // }
    // 현재 백엔드 logout은 메시지만 반환하므로, 클라이언트 측에서는 특별한 API 호출 없이 토큰 제거만 해도 무방.
    // AuthContext에서 localStorage.removeItem('token') 및 사용자 상태 초기화가 주된 작업.
    return Promise.resolve();
  }
};
