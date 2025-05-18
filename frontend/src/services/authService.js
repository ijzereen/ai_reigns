// src/services/authService.js (Mock Version)
export const authService = {
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "test@example.com" && password === "password") {
          const fakeUser = { id: 1, email: "test@example.com", username: "테스트유저" };
          const fakeToken = "fake-jwt-token-for-test-user";
          // localStorage 저장은 AuthContext에서 처리하도록 변경 (일관성)
          resolve({ access_token: fakeToken, user: fakeUser, token_type: "bearer" });
        } else {
          reject(new Error("이메일 또는 비밀번호가 일치하지 않습니다. (가짜 인증)"));
        }
      }, 500);
    });
  },

  signup: async (email, username, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = { id: Date.now(), email, username };
        resolve(newUser);
      }, 500);
    });
  },

  logout: async () => {
    // localStorage 제거는 AuthContext에서 처리
    return Promise.resolve();
  }
};
