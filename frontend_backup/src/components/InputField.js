import React from 'react';

// --- UI 디자인 상수 ---
const POINT_COLOR = '#50AD98';
const TEXT_COLOR = '#111827';
const TEXT_COLOR_SECONDARY = '#4B5563';
const BORDER_COLOR = '#E5E7EB';
const INPUT_BACKGROUND_COLOR = '#FFFFFF'; // 입력 필드 배경은 흰색

const InputField = ({ 
  id, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false, 
  className = '',
  disabled = false
}) => (
  <div className="mb-4 w-full">
    {label && (
      <label 
        htmlFor={id} 
        className={`block text-xs font-medium mb-1 ${error ? 'text-red-600' : `text-[${TEXT_COLOR_SECONDARY}]`}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-[${INPUT_BACKGROUND_COLOR}] border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : `border-[${BORDER_COLOR}] focus:border-[${POINT_COLOR}] focus:ring-[${POINT_COLOR}]`} rounded-md outline-none transition-colors text-[${TEXT_COLOR}] placeholder-gray-400 text-sm shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
      required={required}
      disabled={disabled}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

export default InputField;
