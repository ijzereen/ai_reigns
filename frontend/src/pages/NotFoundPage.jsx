// src/pages/NotFoundPage.jsx
// (이전 not_found_page_jsx_v2_pre_backend_final_180300과 동일)
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-teal-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">페이지를 찾을 수 없습니다.</h2>
      <p className="text-gray-600 mb-8">요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.</p>
      <Link 
        to="/" 
        className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default NotFoundPage;
