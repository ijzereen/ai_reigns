// src/components/common/TextEditModal.jsx
// (이전 text_edit_modal_jsx_v2_pre_backend_final_180300과 동일)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TextEditModal({ isOpen, initialValue, title, onClose, onSave, maxLength }) {
  const [text, setText] = useState(initialValue || '');
  const [charCount, setCharCount] = useState((initialValue || '').length);

  useEffect(() => {
    if (isOpen) {
      setText(initialValue || '');
      setCharCount((initialValue || '').length);
    }
  }, [isOpen, initialValue]);

  const handleChange = (event) => {
    const currentInput = event.target.value;
    if (maxLength === undefined || currentInput.length <= maxLength) {
      setText(currentInput);
      setCharCount(currentInput.length);
    }
  };
  const handleSave = () => { onSave(text); onClose(); };
  const modalVariants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },};
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 },};
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="backdrop-text-edit" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
          <motion.div key="modal-text-edit" variants={modalVariants} initial="hidden" animate="visible" exit="exit"
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{title || "텍스트 편집"}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label="닫기">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto mb-4">
              <textarea value={text} onChange={handleChange}
                className="w-full h-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-base min-h-[200px] sm:min-h-[300px]"
                placeholder="내용을 입력하세요..." rows={15} maxLength={maxLength}/>
            </div>
            {maxLength !== undefined && (<div className="text-right text-sm text-gray-500 mb-4">{charCount} / {maxLength}</div>)}
            <div className="flex justify-end space-x-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors">취소</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm transition-colors">저장</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default TextEditModal;
