// src/utils/authHeader.js

// API 요청 시 사용할 인증 헤더를 반환하는 함수
export function authHeader() {
  // 로컬 스토리지에서 사용자 토큰을 가져옵니다.
  // AuthContext에서 토큰을 저장할 때 사용한 키와 동일해야 합니다. (예: 'authToken')
  const token = localStorage.getItem('authToken');

  if (token) {
    // 토큰이 존재하면 Authorization 헤더에 Bearer 토큰을 포함하여 반환합니다.
    return { 'Authorization': `Bearer ${token}` };
  } else {
    // 토큰이 없으면 빈 객체를 반환합니다.
    return {};
  }
}

// 파일 업로드 등 Content-Type을 다르게 설정해야 하는 경우를 위한 함수
export function authHeaderWithContentType(contentType = 'application/json') {
  const baseAuthHeader = authHeader();
  return { ...baseAuthHeader, 'Content-Type': contentType };
}
