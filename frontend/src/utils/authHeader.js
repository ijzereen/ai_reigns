// src/utils/authHeader.js

export function authHeader() {
  const token = localStorage.getItem('authToken');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  } else {
    return {};
  }
}

export function authHeaderWithContentType(contentType = 'application/json') {
  const baseAuthHeader = authHeader();
  return { ...baseAuthHeader, 'Content-Type': contentType };
}
