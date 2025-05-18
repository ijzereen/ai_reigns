import React from 'react';

// --- UI 디자인 상수 (실제 프로젝트에서는 테마 컨텍스트나 CSS 변수 등으로 관리 가능) ---
const POINT_COLOR = '#50AD98'; // RGB(80, 173, 152)
const POINT_COLOR_HOVER = '#408E7B'; // 포인트 색상의 어두운 버전
const TEXT_COLOR_PRIMARY = '#111827'; // 기본 텍스트 (거의 검은색)
const BORDER_COLOR = '#E5E7EB'; // 연한 회색 테두리

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  type = 'button', 
  disabled = false, 
  iconLeft, 
  iconRight,
  size = 'normal' // 'small', 'normal', 'large'
}) => {
  const baseStyle = `font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-sm rounded-md`;
  
  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs',
    normal: 'px-5 py-2.5 text-sm',
    large: 'px-7 py-3 text-base'
  };

  const variants = {
    primary: `bg-[${POINT_COLOR}] hover:bg-[${POINT_COLOR_HOVER}] text-white focus:ring-[${POINT_COLOR}] border border-transparent`,
    secondary: `bg-gray-100 hover:bg-gray-200 text-[${TEXT_COLOR_PRIMARY}] focus:ring-[${POINT_COLOR}] border border-[${BORDER_COLOR}]`,
    ghost: `bg-transparent hover:bg-gray-100 text-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`,
    danger: `bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 border border-transparent`,
    outline: `bg-transparent hover:bg-gray-50 text-[${POINT_COLOR}] border border-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`,
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} 
      disabled={disabled}
    >
      {iconLeft && <span className={children ? "mr-1.5" : ""}>{iconLeft}</span>}
      {children}
      {iconRight && <span className={children ? "ml-1.5" : ""}>{iconRight}</span>}
    </button>
  );
};

export default Button;
