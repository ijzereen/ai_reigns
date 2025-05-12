import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css'; // 필요시 스타일 파일 생성/추가

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
