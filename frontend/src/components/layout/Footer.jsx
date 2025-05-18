// src/components/layout/Footer.jsx
// (이전 footer_jsx_v2_pre_backend_final_180300과 동일)
import React from 'react';

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} 인터랙티브 스토리 게임. 모든 권리 보유.
      </div>
    </footer>
  );
}

export default Footer;
